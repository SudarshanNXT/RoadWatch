import os
import cv2
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

def extract_features(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    img = cv2.resize(img, (64, 64))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges) / (64 * 64)

    hist = cv2.calcHist(
        [img], [0, 1, 2], None,
        [8, 8, 8], [0, 256, 0, 256, 0, 256]
    ).flatten()

    return np.hstack([edge_density, hist])

def load_split_data(split_name, base_path="Dataset"):
    X, y = [], []
    split_path = os.path.join(base_path, split_name)
    
    if not os.path.exists(split_path):
        return np.array([]), np.array([])
        
    for label in ['1', '2', '3']:
        folder = os.path.join(split_path, label)
        if not os.path.exists(folder):
            continue
        for file in os.listdir(folder):
            if file.lower().endswith(('.jpg', '.png', '.jpeg')):
                path = os.path.join(folder, file)
                features = extract_features(path)
                if features is not None:
                    X.append(features)
                    y.append(int(label) - 1)
                    
    return np.array(X), np.array(y)

def run_training_pipeline(base_path="Dataset"):
    print("Loading training dataset...")
    X_train, y_train = load_split_data("train", base_path)
    print(f"Loaded {len(X_train)} training images.")
    
    print("Loading validation dataset...")
    X_val, y_val = load_split_data("valid", base_path)
    
    print("Loading testing dataset...")
    X_test, y_test = load_split_data("test", base_path)
    
    if len(X_train) == 0:
        return {
            "success": False,
            "error": "No training data found."
        }
        
    print("Fitting Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=150, random_state=42)
    model.fit(X_train, y_train)
    
    # Calculate Metrics
    train_acc = accuracy_score(y_train, model.predict(X_train))
    
    val_acc = 0.0
    if len(X_val) > 0:
        val_acc = accuracy_score(y_val, model.predict(X_val))
        
    test_acc = 0.0
    if len(X_test) > 0:
        test_acc = accuracy_score(y_test, model.predict(X_test))
        
    # Save the trained model
    model_file_path = "road_damage_model.pkl"
    joblib.dump(model, model_file_path)
    print(f"Model saved successfully to {model_file_path}")
    
    return {
        "success": True,
        "train_size": len(X_train),
        "valid_size": len(X_val),
        "test_size": len(X_test),
        "train_accuracy": round(train_acc * 100, 2),
        "valid_accuracy": round(val_acc * 100, 2),
        "test_accuracy": round(test_acc * 100, 2)
    }

if __name__ == "__main__":
    results = run_training_pipeline()
    if results.get("success"):
        print("\n--- Training Pipeline Complete ---")
        print(f"Train Dataset Size: {results['train_size']}")
        print(f"Validation Dataset Size: {results['valid_size']}")
        print(f"Testing Dataset Size: {results['test_size']}")
        print(f"Training Accuracy: {results['train_accuracy']}%")
        print(f"Validation Accuracy: {results['valid_accuracy']}%")
        print(f"Testing Accuracy: {results['test_accuracy']}%")
    else:
        print(f"Error training model: {results.get('error')}")