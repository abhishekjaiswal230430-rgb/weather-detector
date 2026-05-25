import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend to avoid GUI threads in web server
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# Paths for saving models and visualization artifacts
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(MODEL_DIR, 'static')
PLOTS_DIR = os.path.join(STATIC_DIR, 'plots')

MODEL_PATH = os.path.join(MODEL_DIR, 'model.bin')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.bin')
DATASET_PATH = os.path.join(MODEL_DIR, 'weather_dataset.csv')

# Ensure plot directory exists
os.makedirs(PLOTS_DIR, exist_ok=True)

def generate_synthetic_data(num_samples=2500, seed=42):
    """
    Generates a realistic synthetic weather dataset based on meteorological heuristics
    with some added noise to simulate real-world conditions.
    """
    np.random.seed(seed)
    
    # Generate ranges for variables
    temp = np.random.uniform(-10, 45, num_samples)          # -10°C to 45°C
    humidity = np.random.uniform(10, 100, num_samples)       # 10% to 100%
    wind_speed = np.random.uniform(0, 60, num_samples)       # 0 to 60 km/h
    pressure = np.random.uniform(970, 1030, num_samples)     # 970 to 1030 hPa
    
    weather = []
    for i in range(num_samples):
        t = temp[i]
        h = humidity[i]
        w = wind_speed[i]
        p = pressure[i]
        
        # Categorization based on physical conditions
        # 1. Stormy (Very windy, high humidity, low pressure)
        if w > 35 and h > 70 and p < 1002:
            lbl = 'Stormy'
        # 2. Rainy (High humidity, low pressure, moderate winds, positive temp)
        elif h > 80 and p < 1008 and w > 12 and t > 0:
            lbl = 'Rainy'
        # 3. Foggy (Very high humidity, very low wind speed, cool temperatures)
        elif h > 88 and w < 10 and t < 18:
            lbl = 'Foggy'
        # 4. Sunny (Warm/Hot, dry, high pressure)
        elif t > 18 and h < 50 and p > 1012:
            lbl = 'Sunny'
        # 5. Cloudy (Moderate humidity, moderate pressure)
        elif h > 55 and 1000 <= p <= 1016:
            lbl = 'Cloudy'
        else:
            # Overlapping/Borderline cases to make the ML model learn decisions
            if h > 75 and p < 1012:
                lbl = 'Rainy' if np.random.rand() > 0.3 else 'Cloudy'
            elif t < 5 and h > 75:
                lbl = 'Foggy' if w < 12 else 'Cloudy'
            elif p > 1014 and h < 45:
                lbl = 'Sunny'
            elif w > 28 and p < 1005:
                lbl = 'Stormy' if h > 50 else 'Cloudy'
            else:
                # Default mixture based on temperature
                if t > 22:
                    choices, weights = ['Sunny', 'Cloudy', 'Rainy'], [0.5, 0.4, 0.1]
                elif t < 8:
                    choices, weights = ['Cloudy', 'Foggy', 'Rainy'], [0.4, 0.4, 0.2]
                else:
                    choices, weights = ['Cloudy', 'Sunny', 'Rainy'], [0.5, 0.3, 0.2]
                lbl = np.random.choice(choices, p=weights)
                
        weather.append(lbl)
        
    df = pd.DataFrame({
        'Temperature': np.round(temp, 1),
        'Humidity': np.round(humidity, 0).astype(int),
        'Wind_Speed': np.round(wind_speed, 1),
        'Pressure': np.round(pressure, 0).astype(int),
        'Weather': weather
    })
    
    return df

def generate_plots(df, X_test, y_test, y_pred, model, feature_names):
    """
    Generates and saves model performance and data distribution plots
    """
    # Set styling style for modern aesthetics
    plt.style.use('ggplot')
    sns.set_theme(style="darkgrid")
    
    # 1. Weather Distribution Plot
    plt.figure(figsize=(8, 5))
    palette = {'Sunny': '#FFC107', 'Rainy': '#1E88E5', 'Cloudy': '#90A4AE', 'Foggy': '#B0BEC5', 'Stormy': '#5E35B1'}
    sns.countplot(data=df, x='Weather', order=list(palette.keys()), palette=palette)
    plt.title('Weather Condition Distribution in Dataset', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Weather Condition', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'weather_distribution.png'), dpi=150)
    plt.close()
    
    # 2. Confusion Matrix Plot
    cm = confusion_matrix(y_test, y_pred)
    classes = sorted(df['Weather'].unique())
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes,
                cbar=False, annot_kws={"size": 12, "weight": "bold"})
    plt.title('Confusion Matrix', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('True Label', fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'confusion_matrix.png'), dpi=150)
    plt.close()
    
    # 3. Feature Importance Plot
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-index_offset() if False else ...]  # reverse sort indices
    sorted_features = [feature_names[i] for i in indices]
    sorted_importances = importances[indices]
    
    plt.figure(figsize=(8, 5))
    sns.barplot(x=sorted_importances, y=sorted_features, palette='viridis')
    plt.title('Random Forest Feature Importance', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Importance Score', fontsize=12)
    plt.ylabel('Feature', fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'feature_importance.png'), dpi=150)
    plt.close()

def run_pipeline():
    """
    Executes the complete ML pipeline: data generation, preprocessing,
    training, evaluation, plotting, and model saving.
    """
    print("--- Executing Weather Detector ML Pipeline ---")
    
    # 1. Dataset Generation / Loading
    if not os.path.exists(DATASET_PATH):
        print(f"Generating synthetic dataset at: {DATASET_PATH}")
        df = generate_synthetic_data()
        df.to_csv(DATASET_PATH, index=False)
    else:
        print(f"Loading existing dataset from: {DATASET_PATH}")
        df = pd.read_csv(DATASET_PATH)
        
    # 2. Preprocessing & Split
    feature_cols = ['Temperature', 'Humidity', 'Wind_Speed', 'Pressure']
    X = df[feature_cols]
    y = df['Weather']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 3. Scale Features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 4. Model Training
    print("Training Random Forest Classifier model...")
    # Initialize Random Forest with optimized parameters
    model = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)
    
    # 5. Testing and Evaluation
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Training Complete. Test Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # 6. Generate and save visualization plots
    print("Generating and saving performance visual charts...")
    generate_plots(df, X_test_scaled, y_test, y_pred, model, feature_cols)
    
    # 7. Save trained artifacts
    print(f"Saving model to {MODEL_PATH}")
    joblib.dump(model, MODEL_PATH)
    
    print(f"Saving scaler to {SCALER_PATH}")
    joblib.dump(scaler, SCALER_PATH)
    
    # Save metadata JSON
    import json
    metadata_path = os.path.join(MODEL_DIR, 'metadata.json')
    metadata = {
        'accuracy': float(accuracy),
        'n_estimators': int(model.n_estimators),
        'max_depth': int(model.max_depth) if model.max_depth else None,
        'algorithm': 'Random Forest Classifier'
    }
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"Saving model metadata to {metadata_path}")
    
    print("--- ML Pipeline Finished Successfully ---\n")
    return accuracy

if __name__ == '__main__':
    run_pipeline()
