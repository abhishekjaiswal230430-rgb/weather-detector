# AeroPredict: Weather Detector using Machine Learning

AeroPredict is a modern, responsive, full-stack weather classification and prediction application. It utilizes a **Random Forest Classifier** trained on meteorological observations (Temperature, Humidity, Wind Speed, and Atmospheric Pressure) to predict local weather conditions (Sunny, Rainy, Cloudy, Foggy, Stormy).

The project features a sleek, dark-mode glassmorphic dashboard built using **Flask** and **Vanilla HTML/CSS/JS**, featuring dynamic animations, real-time input sliders, an analytics panel, and prediction logging powered by a local **SQLite** database.

---

## Key Features

1. **Machine Learning Core**: Trains a Random Forest Classifier with automatic pipeline triggers.
2. **Dynamic UI Styling**: The interface colors, glowing gradients, icons, and advisory messages dynamically adapt to the predicted weather condition.
3. **Interactive Control Sliders**: Meteorological values can be adjusted via synchronized range sliders or direct numerical inputs.
4. **SQLite Logging**: Every prediction is written to a local database and visible on an interactive prediction history log.
5. **Interactive Analytics**: Visualizes training distribution, model feature importances, and validation confusion matrices.
6. **Mobile Responsive**: Fully responsive layout designed for desktop, tablet, and mobile views.

---

## Folder Structure

```text
weather-detector/
│
├── app.py                     # Main Flask web application & server
├── model_pipeline.py          # Machine learning pipeline (dataset, training, plots)
├── database.py                # Database utilities for prediction history logs (SQLite)
├── requirements.txt           # Python dependency packages list
├── README.md                  # Setup instructions and documentation (this file)
│
├── templates/
│   └── index.html             # Main single-page glassmorphic dashboard UI
│
└── static/
    ├── css/
    │   └── style.css          # Premium stylesheets (responsive grids, glassmorphism)
    ├── js/
    │   └── main.js            # Frontend AJAX requests, tab managers, and UI updates
    └── plots/                 # Saved training evaluation charts
        ├── confusion_matrix.png
        ├── feature_importance.png
        └── weather_distribution.png
```

---

## Step-by-Step Setup Instructions

### 1. Prerequisites
- **Python 3.8+** must be installed on your local computer.
- **pip** (Python Package Installer) should be available.

### 2. Clone/Open the Workspace
Open your command terminal (Command Prompt, PowerShell, or Git Bash) inside the project directory:
```bash
cd "path/to/weather detector"
```

### 3. Setup Virtual Environment (Recommended)
Create and activate a virtual environment to isolate the project packages:
- **Windows**:
  ```bash
  python -m venv venv
  .\venv\Scripts\activate
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 4. Install Dependencies
Install all the required machine learning and web server packages using pip:
```bash
pip install -r requirements.txt
```

---

## Running the Project

1. Launch the web application:
   ```bash
   python app.py
   ```
2. The application will start. If the trained model file (`model.bin`) is not found, the backend will **automatically run the ML pipeline**, generate the synthetic weather dataset, train the Random Forest model, output the performance plots, and start the local server.
3. Open your web browser and navigate to:
   ```text
   http://127.0.0.1:5000/
   ```

---

## API Endpoints

- **`GET /`**: Serves the frontend single-page application.
- **`POST /predict`**: Accepts JSON input and returns the classification result.
  - *Request Body*:
    ```json
    {
      "temperature": 25.5,
      "humidity": 45,
      "wind_speed": 12.0,
      "pressure": 1014
    }
    ```
  - *Response Body*:
    ```json
    {
      "success": true,
      "prediction": "Sunny",
      "confidence": 92.5,
      "probabilities": { "Sunny": 92.5, "Cloudy": 7.5, ... },
      "recommendation": "It's a perfect day for outdoor activities...",
      "details": "High atmospheric pressure...",
      "icon_class": "wi-day-sunny"
    }
    ```
- **`GET /history`**: Returns the list of last 50 queries logged in the SQLite database.
- **`POST /history/clear`**: Clears all saved logs.
- **`GET /stats`**: Returns classifier parameters (n_estimators, max_depth) and feature importance scores.

---

## Troubleshooting

- **Python Command Redirects to Microsoft Store (Windows)**:
  Ensure Python is added to your System Environment variables PATH. Alternatively, try using the Windows Launcher command:
  ```bash
  py app.py
  ```
- **Port 5000 Already in Use**:
  If port 5000 is occupied, you can change the port in `app.py` at line 168:
  ```python
  app.run(host='0.0.0.0', port=8080, debug=True)
  ```
