import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'predictions.db')

def get_db_connection():
    """
    Returns an open connection to the SQLite database with row factory enabled
    for convenient dict-like access.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initializes the SQLite database and creates the prediction history table.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prediction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            wind_speed REAL NOT NULL,
            pressure REAL NOT NULL,
            predicted_weather TEXT NOT NULL,
            confidence REAL NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print(f"Database initialized at: {DB_PATH}")

def log_prediction(temperature, humidity, wind_speed, pressure, predicted_weather, confidence):
    """
    Saves a new prediction entry in the sqlite table.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Local time formatting for timestamps
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO prediction_history 
            (timestamp, temperature, humidity, wind_speed, pressure, predicted_weather, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (now_str, temperature, humidity, wind_speed, pressure, predicted_weather, confidence))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error logging prediction: {e}")
        return False

def get_history(limit=100):
    """
    Retrieves previous prediction records from the database.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, timestamp, temperature, humidity, wind_speed, pressure, predicted_weather, confidence 
            FROM prediction_history 
            ORDER BY id DESC 
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        
        history_list = []
        for row in rows:
            history_list.append({
                'id': row['id'],
                'timestamp': row['timestamp'],
                'temperature': row['temperature'],
                'humidity': row['humidity'],
                'wind_speed': row['wind_speed'],
                'pressure': row['pressure'],
                'predicted_weather': row['predicted_weather'],
                'confidence': round(row['confidence'] * 100, 1)  # percentage
            })
            
        conn.close()
        return history_list
    except Exception as e:
        print(f"Error fetching prediction history: {e}")
        return []

def clear_history():
    """
    Clears all prediction logs.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM prediction_history')
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error clearing history: {e}")
        return False

if __name__ == '__main__':
    init_db()
