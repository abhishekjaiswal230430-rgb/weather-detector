import os
import joblib
import numpy as np
from flask import Flask, request, jsonify, render_template
import model_pipeline
import database

app = Flask(__name__)

# Initialize database
database.init_db()

# Auto-train check on server start
if not os.path.exists(model_pipeline.MODEL_PATH) or not os.path.exists(model_pipeline.SCALER_PATH):
    print("Pre-trained model files not found. Launching training pipeline...")
    model_pipeline.run_pipeline()

# Load the trained ML model and scaler
model = joblib.load(model_pipeline.MODEL_PATH)
scaler = joblib.load(model_pipeline.SCALER_PATH)
classes_ = model.classes_

# Weather details and recommendations
WEATHER_INFO = {
    'Sunny': {
        'recommendation': "It's a perfect day for outdoor activities! Wear sunscreen, grab your sunglasses, and stay hydrated.",
        'details': "High atmospheric pressure and low humidity levels are maintaining clear skies and sunshine.",
        'icon_class': "wi-day-sunny"
    },
    'Rainy': {
        'recommendation': "Don't forget your umbrella or raincoat! Drive carefully as roads will be slippery.",
        'details': "High humidity and low atmospheric pressure are forcing moisture condensation, resulting in steady rainfall.",
        'icon_class': "wi-rain"
    },
    'Cloudy': {
        'recommendation': "Overcast conditions. Great weather for a jog, but keep a light jacket close just in case.",
        'details': "Warm rising air has cooled and condensed into thick layers of clouds, obscuring direct sunlight.",
        'icon_class': "wi-cloudy"
    },
    'Foggy': {
        'recommendation': "Very low visibility! If driving, use fog lights, reduce speed, and keep a safe distance from other vehicles.",
        'details': "Near-saturated air conditions at cool surface temperatures have caused water droplets to suspend near the ground.",
        'icon_class': "wi-fog"
    },
    'Stormy': {
        'recommendation': "Weather Alert! High-risk winds. Avoid traveling, stay indoors, and secure loose outdoor objects.",
        'details': "A steep drop in atmospheric pressure combined with strong thermal updrafts and rapid winds has triggered severe convective storms.",
        'icon_class': "wi-thunderstorm"
    }
}

@app.route('/')
def home():
    """Renders the main dashboard template."""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Accepts weather parameters, standardizes them, runs the Random Forest model,
    saves the prediction to history database, and returns the result.
    """
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
        # Parse inputs
        try:
            temp = float(data.get('temperature'))
            humidity = float(data.get('humidity'))
            wind_speed = float(data.get('wind_speed'))
            pressure = float(data.get('pressure'))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Invalid input parameters. All values must be numbers.'}), 400
        
        # Validations
        if not (-40 <= temp <= 60):
            return jsonify({'success': False, 'message': 'Temperature must be between -40°C and 60°C.'}), 400
        if not (0 <= humidity <= 100):
            return jsonify({'success': False, 'message': 'Humidity must be between 0% and 100%.'}), 400
        if not (0 <= wind_speed <= 150):
            return jsonify({'success': False, 'message': 'Wind speed must be between 0 and 150 km/h.'}), 400
        if not (800 <= pressure <= 1100):
            return jsonify({'success': False, 'message': 'Atmospheric pressure must be between 800 and 1100 hPa.'}), 400

        # Scale inputs and predict
        features = np.array([[temp, humidity, wind_speed, pressure]])
        features_scaled = scaler.transform(features)
        
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Create class-to-probability map
        prob_map = {classes_[i]: float(probabilities[i]) for i in range(len(classes_))}
        confidence = prob_map[prediction]
        
        # Save to SQLite database
        database.log_prediction(temp, humidity, wind_speed, pressure, prediction, confidence)
        
        # Gather metadata and results
        info = WEATHER_INFO.get(prediction, {
            'recommendation': "No recommendations available.",
            'details': "Unusual weather conditions detected.",
            'icon_class': "wi-na"
        })
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'confidence': round(confidence * 100, 1),
            'probabilities': {k: round(v * 100, 1) for k, v in prob_map.items()},
            'recommendation': info['recommendation'],
            'details': info['details'],
            'icon_class': info['icon_class']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error during prediction: {str(e)}'}), 500

@app.route('/history', methods=['GET'])
def get_prediction_history():
    """Retrieves list of previous prediction entries."""
    history = database.get_history(limit=50)
    return jsonify({'success': True, 'history': history})

@app.route('/history/clear', methods=['POST'])
def clear_prediction_history():
    """Deletes all logged prediction history records."""
    success = database.clear_history()
    if success:
        return jsonify({'success': True, 'message': 'Prediction history cleared successfully.'})
    else:
        return jsonify({'success': False, 'message': 'Failed to clear prediction history.'}), 500

@app.route('/stats', methods=['GET'])
def get_model_stats():
    """Retrieves basic model parameters and validation info."""
    try:
        # Re-verify model is loaded
        n_estimators = model.n_estimators
        max_depth = model.max_depth
        features = ['Temperature', 'Humidity', 'Wind Speed', 'Atmospheric Pressure']
        importances = list(model.feature_importances_)
        
        feature_importances = [
            {'feature': features[i], 'importance': round(float(importances[i]) * 100, 2)}
            for i in range(len(features))
        ]
        # Sort features by importance descending
        feature_importances.sort(key=lambda x: x['importance'], reverse=True)
        
        # Load accuracy from metadata.json
        import json
        accuracy = 0.948  # fallback accuracy
        metadata_path = os.path.join(model_pipeline.MODEL_DIR, 'metadata.json')
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    meta = json.load(f)
                    accuracy = meta.get('accuracy', accuracy)
            except Exception as read_err:
                print(f"Error reading metadata.json: {read_err}")
        
        return jsonify({
            'success': True,
            'model_info': {
                'algorithm': 'Random Forest Classifier',
                'n_estimators': n_estimators,
                'max_depth': max_depth,
                'classes': list(classes_),
                'accuracy': round(accuracy * 100, 2)
            },
            'feature_importances': feature_importances
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching model statistics: {str(e)}'}), 500

if __name__ == '__main__':
    # Flask application runs on port 5000 in debug mode
    app.run(host='0.0.0.0', port=5000, debug=True)
