# Viva Questions and Answers: Weather Detector using Machine Learning

This document compiles the most common viva-voce questions and conceptual questions asked during practical examinations, project presentations, and machine learning interviews.

---

### Q1: What is the main objective of this project?
**Answer:** The objective is to build a classification system that predicts weather conditions (Sunny, Rainy, Cloudy, Foggy, Stormy) based on four atmospheric parameters: Temperature, Humidity, Wind Speed, and Atmospheric Pressure. It uses a **Random Forest Classifier** as the ML engine and provides a web-based responsive UI using **Flask** for prediction inputs, live analytics, and prediction logging.

---

### Q2: What is a Random Forest Classifier and how does it work?
**Answer:** Random Forest is an ensemble learning method that fits a collection of independent decision trees on various sub-samples of the dataset. It uses two key techniques:
1. **Bagging (Bootstrap Aggregating)**: Trees are trained on random subsets of the data (sampled with replacement).
2. **Feature Randomness**: At each split in a tree, only a random subset of features is considered.
For prediction, the algorithm aggregates the individual tree classifications and outputs the class with the **majority vote**.

---

### Q3: Why is Random Forest preferred over a single Decision Tree?
**Answer:** A single decision tree tends to overfit the training data, capturing noise and details that do not generalize well. By training multiple trees (ensemble) on different subsets and averaging their predictions, Random Forest:
- Significantly reduces model **variance** (generalizes better).
- Maintains low **bias**.
- Is highly robust to noise and outliers.

---

### Q4: What features (inputs) are used in your model, and what is the target (output)?
**Answer:**
- **Input Features (Independent Variables)**:
  1. Temperature (°C)
  2. Humidity (%)
  3. Wind Speed (km/h)
  4. Atmospheric Pressure (hPa)
- **Target Variable (Dependent Variable)**: 
  - Weather Condition (Categorical: Sunny, Rainy, Cloudy, Foggy, Stormy)

---

### Q5: What is Feature Scaling, and why is it used in this project?
**Answer:** Feature scaling is the process of normalizing the range of independent variables. In this project, we use `StandardScaler` which scales features to have a mean of $0$ and a standard deviation of $1$ (Z-score standardization).
While Random Forest is scale-invariant (doesn't strictly require scaling because splits are done per feature individually), scaling is used here as a standard ML engineering practice. If we decide to swap Random Forest with other algorithms (like Support Vector Machines, K-Nearest Neighbors, or Logistic Regression), the scaling pipeline is already in place.

---

### Q6: How does the dataset generation function work in your code?
**Answer:** The synthetic generator uses meteorological heuristics to assign weather labels to randomized parameter values:
- E.g., if wind speed is very high ($>35\text{ km/h}$) and pressure is very low ($<1002\text{ hPa}$), the label is set to **Stormy**.
- Borderline inputs are given random distributions (e.g. high humidity and medium pressure has a 70% chance of being Rainy and 30% Cloudy) to simulate noise and natural overlaps, forcing the machine learning classifier to learn complex decision boundaries.

---

### Q7: What is a Confusion Matrix? How is it useful?
**Answer:** A confusion matrix is a table layout used to describe the performance of a classification model on a set of test data for which the true values are known. It tabulates:
- **True Positives (TP)**
- **True Negatives (TN)**
- **False Positives (FP)** (Type I Error)
- **False Negatives (FN)** (Type II Error)
It helps identify specific classes that the model is misclassifying (e.g., confusing "Cloudy" with "Rainy").

---

### Q8: How is the prediction history saved in this project?
**Answer:** Prediction logs are persisted locally using **SQLite**, a lightweight serverless relational database engine. We use Python’s built-in `sqlite3` library. The `database.py` script initializes a `prediction_history` table and handles standard SQL commands (`INSERT`, `SELECT`, `DELETE`) to store and retrieve records.

---

### Q9: Explain the end-to-end communication flow when a user clicks the "Predict" button.
**Answer:**
1. The user adjusts sliders in the HTML form and clicks "Predict".
2. Frontend JavaScript (`main.js`) captures the values, performs basic validation, and sends an asynchronous **AJAX POST** request with JSON payload to the `/predict` route of the Flask server.
3. The Flask app (`app.py`) parses the parameters and scales them using the saved `StandardScaler` (`scaler.bin`).
4. The scaled vector is passed to the Random Forest model (`model.bin`) which predicts the weather class and class probability scores.
5. The result is logged to the SQLite database.
6. Flask sends a JSON response back to the client.
7. JavaScript dynamically updates the CSS theme classes of the card, changes weather icons, updates prediction bars, and refreshes the database logs table.

---

### Q10: What are the main hyperparameters of a Random Forest Classifier?
**Answer:**
- `n_estimators`: The number of decision trees in the forest (configured to 150 in this project).
- `max_depth`: The maximum depth of each tree (configured to 12 to prevent overfitting).
- `min_samples_split`: The minimum number of samples required to split an internal node.
- `criterion`: The function to measure split quality (usually 'gini' or 'entropy').
