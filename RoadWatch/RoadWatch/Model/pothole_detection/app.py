from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from model_utils import predict_image, reload_model
from train_model import run_training_pipeline

app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
def analyze():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    temp_fd, temp_path = tempfile.mkstemp(suffix=".jpg")

    try:
        file.save(temp_path)
        result = predict_image(temp_path)
        return jsonify(result)

    except Exception as e:
        print("Error during analysis:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        os.close(temp_fd)
        os.remove(temp_path)

@app.route("/retrain", methods=["POST"])
def retrain():
    try:
        print("Received retrain request from admin backend...")
        results = run_training_pipeline()
        
        if results.get("success"):
            # Hot-reload the model immediately in memory
            reload_model()
            return jsonify(results)
        else:
            return jsonify({"error": results.get("error", "Training failed")}), 500

    except Exception as e:
        print("Error during retraining:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)