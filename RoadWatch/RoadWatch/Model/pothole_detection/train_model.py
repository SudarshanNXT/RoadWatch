import os
import cv2
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

def extract_features(image_path):
    img = cv2.imread(image_path)
    img = cv2.resize(img, (64, 64))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges) / (64 * 64)

    hist = cv2.calcHist(
        [img], [0,1,2], None,
        [8,8,8], [0,256,0,256,0,256]
    ).flatten()

    return np.hstack([edge_density, hist])


X, y = [], []
train_path = "Dataset/train"

for label in ['1','2','3']:
    folder = os.path.join(train_path, label)
    for file in os.listdir(folder):
        if file.lower().endswith(('.jpg','.png','.jpeg')):
            path = os.path.join(folder, file)
            X.append(extract_features(path))
            y.append(int(label)-1)

X, y = np.array(X), np.array(y)

model = RandomForestClassifier(n_estimators=150, random_state=42)
model.fit(X, y)

joblib.dump(model, "road_damage_model.pkl")

print("Model trained and saved successfully")