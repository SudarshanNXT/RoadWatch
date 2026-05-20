from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from model_utils import predict_image

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
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        os.close(temp_fd)
        os.remove(temp_path)

if __name__ == "__main__":
    app.run(debug=True, port=5000)