from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load model safely
try:
    model = joblib.load("uv_model.pkl")
except Exception as e:
    model = None
    print("Error loading model:", e)

# Test route
@app.route("/")
def home():
    return "UV Prediction API is running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json

    required_fields = [
        "temperature", "humidity", "wind_kph",
        "pressure", "cloud", "feels_like", "visibility"
    ]

    # Check missing fields
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        features = [[
            float(data["temperature"]),
            float(data["humidity"]),
            float(data["wind_kph"]),
            float(data["pressure"]),
            float(data["cloud"]),
            float(data["feels_like"]),
            float(data["visibility"])
        ]]

        columns = [
            "temperature_celsius",
            "humidity",
            "wind_kph",
            "pressure_mb",
            "cloud",
            "feels_like_celsius",
            "visibility_km"
        ]   

        df = pd.DataFrame(features, columns=columns)
        prediction = model.predict(df)

        return jsonify({
            "uv_prediction": round(float(prediction[0]), 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)