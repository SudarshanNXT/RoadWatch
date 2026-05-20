import cv2
import numpy as np
import joblib

model = joblib.load("road_damage_model.pkl")

def extract_features(image_path):
    img = cv2.imread(image_path)
    img = cv2.resize(img, (64, 64))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges) / (64 * 64)

    hist = cv2.calcHist(
        [img], [0, 1, 2], None,
        [8, 8, 8],
        [0, 256, 0, 256, 0, 256]
    ).flatten()

    return np.hstack([edge_density, hist])


def predict_image(image_path):
    features = extract_features(image_path)
    prediction = model.predict([features])[0]

    label_map = {
        0: "Low Damage",
        1: "Medium Damage",
        2: "High Damage"
    }

    severity_map = {
        0: "low",
        1: "medium",
        2: "high"
    }

    score_map = {
        0: 30,
        1: 60,
        2: 100
    }

    proba = model.predict_proba([features])[0]
    confidence = float(max(proba))

    return {
        "class_id": int(prediction),
        "damage_label": label_map[prediction],
        "severity": severity_map[prediction],
        "final_score": score_map[prediction],
        "confidence": round(confidence * 100, 2)
    }