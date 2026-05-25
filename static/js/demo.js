// GLOBAL STATE
let currentTab = 'predict';
let currentSlide = 0;
const totalSlides = 3;

// MOCK STATISTICS DATA
const MODEL_STATS = {
    model_info: {
        algorithm: 'Random Forest Classifier',
        n_estimators: 150,
        max_depth: 12,
        accuracy: 94.82
    },
    feature_importances: [
        { feature: 'Humidity', importance: 37.24 },
        { feature: 'Atmospheric Pressure', importance: 28.16 },
        { feature: 'Wind Speed', importance: 18.52 },
        { feature: 'Temperature', importance: 16.08 }
    ]
};

// WEATHER DETAILS AND RECOMMENDATIONS (matches app.py)
const WEATHER_INFO = {
    'Sunny': {
        recommendation: "It's a perfect day for outdoor activities! Wear sunscreen, grab your sunglasses, and stay hydrated.",
        details: "High atmospheric pressure and low humidity levels are maintaining clear skies and sunshine.",
        iconName: "sun"
    },
    'Rainy': {
        recommendation: "Don't forget your umbrella or raincoat! Drive carefully as roads will be slippery.",
        details: "High humidity and low atmospheric pressure are forcing moisture condensation, resulting in steady rainfall.",
        iconName: "cloud-rain"
    },
    'Cloudy': {
        recommendation: "Overcast conditions. Great weather for a jog, but keep a light jacket close just in case.",
        details: "Warm rising air has cooled and condensed into thick layers of clouds, obscuring direct sunlight.",
        iconName: "cloud"
    },
    'Foggy': {
        recommendation: "Very low visibility! If driving, use fog lights, reduce speed, and keep a safe distance from other vehicles.",
        details: "Near-saturated air conditions at cool surface temperatures have caused water droplets to suspend near the ground.",
        iconName: "cloud-fog"
    },
    'Stormy': {
        recommendation: "Weather Alert! High-risk winds. Avoid traveling, stay indoors, and secure loose outdoor objects.",
        details: "A steep drop in atmospheric pressure combined with strong thermal updrafts and rapid winds has triggered severe convective storms.",
        iconName: "cloud-lightning"
    }
};

// ON PAGE LOAD INITIALIZATIONS
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Set current date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load local storage history & model stats
    loadHistory();
    loadModelStats();
    
    // Sync initial range value displays
    syncInputs('temperature', 'num');
    syncInputs('humidity', 'num');
    syncInputs('wind', 'num');
    syncInputs('pressure', 'num');
});

// DATE-TIME CLOCK WIDGET
function updateDateTime() {
    const dateTimeSpan = document.getElementById('date-time-display');
    if (dateTimeSpan) {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        dateTimeSpan.textContent = now.toLocaleDateString('en-US', options);
    }
}

// TAB NAVIGATION SYSTEM
function switchTab(tabName) {
    // Reset active button classes
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Set active tab
    currentTab = tabName;
    document.getElementById(`btn-${tabName}`).classList.add('active');
    document.getElementById(`tab-content-${tabName}`).classList.add('active');
    
    // Update headers based on tab
    const title = document.getElementById('tab-title');
    const desc = document.getElementById('tab-desc');
    
    if (tabName === 'predict') {
        title.textContent = 'Weather Detector Dashboard (Demo)';
        desc.textContent = 'Input meteorological parameters to predict local weather conditions using machine learning.';
    } else if (tabName === 'history') {
        title.textContent = 'Archived Predictions (Local Session)';
        desc.textContent = 'View and manage historical weather predictions recorded in your browser local storage.';
        loadHistory();
    } else if (tabName === 'model') {
        title.textContent = 'Random Forest Model Analytics';
        desc.textContent = 'Explore model specifications, classification performance metrics, and feature importances.';
    }
}

// SYNC RANGE SLIDER & NUMERIC TEXT INPUTS
function syncInputs(param, source) {
    const slider = document.getElementById(`${param}-slider`);
    const num = document.getElementById(`${param}-num`);
    
    if (source === 'slider') {
        num.value = slider.value;
    } else {
        slider.value = num.value;
    }
}

// CLIENT-SIDE RANDOM FOREST CLASSIFICATION HEURISTICS (Simulation)
function simulateModelPrediction(temp, humidity, wind, pressure) {
    let prediction = 'Cloudy';
    let rawProbabilities = { Sunny: 10, Rainy: 10, Cloudy: 40, Foggy: 10, Stormy: 10 };
    
    // Meterological logic simulation matching train_model rules
    if (wind > 35 && humidity > 70 && pressure < 1002) {
        prediction = 'Stormy';
        rawProbabilities = { Sunny: 1, Rainy: 12, Cloudy: 5, Foggy: 2, Stormy: 80 };
    } else if (humidity > 80 && pressure < 1008 && wind > 12 && temp > 0) {
        prediction = 'Rainy';
        rawProbabilities = { Sunny: 0, Rainy: 85, Cloudy: 10, Foggy: 2, Stormy: 3 };
    } else if (humidity > 88 && wind < 10 && temp < 18) {
        prediction = 'Foggy';
        rawProbabilities = { Sunny: 0, Rainy: 5, Cloudy: 10, Foggy: 83, Stormy: 2 };
    } else if (temp > 18 && humidity < 50 && pressure > 1012) {
        prediction = 'Sunny';
        rawProbabilities = { Sunny: 90, Rainy: 0, Cloudy: 8, Foggy: 2, Stormy: 0 };
    } else if (humidity > 55 && pressure >= 1000 && pressure <= 1016) {
        prediction = 'Cloudy';
        rawProbabilities = { Sunny: 15, Rainy: 15, Cloudy: 65, Foggy: 3, Stormy: 2 };
    } else {
        // Borderlines
        if (humidity > 75 && pressure < 1012) {
            prediction = 'Rainy';
            rawProbabilities = { Sunny: 2, Rainy: 58, Cloudy: 35, Foggy: 2, Stormy: 3 };
        } else if (temp < 5 && humidity > 75) {
            prediction = 'Foggy';
            rawProbabilities = { Sunny: 0, Rainy: 8, Cloudy: 32, Foggy: 60, Stormy: 0 };
        } else if (pressure > 1014 && humidity < 45) {
            prediction = 'Sunny';
            rawProbabilities = { Sunny: 80, Rainy: 2, Cloudy: 15, Foggy: 1, Stormy: 0 };
        } else {
            // Mix based on Temperature
            if (temp > 22) {
                prediction = 'Sunny';
                rawProbabilities = { Sunny: 50, Cloudy: 38, Rainy: 10, Foggy: 1, Stormy: 1 };
            } else if (temp < 8) {
                prediction = 'Cloudy';
                rawProbabilities = { Sunny: 5, Cloudy: 48, Rainy: 15, Foggy: 30, Stormy: 2 };
            } else {
                prediction = 'Cloudy';
                rawProbabilities = { Sunny: 25, Cloudy: 50, Rainy: 20, Foggy: 3, Stormy: 2 };
            }
        }
    }
    
    return {
        prediction: prediction,
        probabilities: rawProbabilities
    };
}

// HANDLE PREDICTION CLIENT SUBMISSION
function handlePrediction(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('predict-submit-btn');
    const submitBtnText = submitBtn.querySelector('span');
    const originalText = submitBtnText.textContent;
    
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Simulating Decision Trees...';
    
    const temp = parseFloat(document.getElementById('temperature-num').value);
    const humidity = parseFloat(document.getElementById('humidity-num').value);
    const wind = parseFloat(document.getElementById('wind-num').value);
    const pressure = parseFloat(document.getElementById('pressure-num').value);
    
    // Simulate training delay for realism
    setTimeout(() => {
        const result = simulateModelPrediction(temp, humidity, wind, pressure);
        const prediction = result.prediction;
        const confidence = result.probabilities[prediction];
        
        // Save to LocalStorage
        saveToLocalStorage(temp, humidity, wind, pressure, prediction, confidence);
        
        // Show result data container
        document.getElementById('result-placeholder').classList.add('hidden');
        const resultData = document.getElementById('result-data');
        resultData.classList.remove('hidden');
        
        // Apply weather theme gradient colors
        const resultPanel = document.getElementById('result-panel');
        resultPanel.className = 'glass-card result-panel'; // Reset
        resultPanel.classList.add(`${prediction.toLowerCase()}-theme`);
        
        // Update information fields
        document.getElementById('predicted-state').textContent = prediction;
        document.getElementById('confidence-val').textContent = `${confidence}% Match`;
        document.getElementById('weather-explanation').textContent = WEATHER_INFO[prediction].details;
        document.getElementById('weather-recommendation').textContent = WEATHER_INFO[prediction].recommendation;
        
        // Update icon dynamically
        const iconWrapper = document.getElementById('weather-icon-div');
        iconWrapper.innerHTML = `<i data-lucide="${WEATHER_INFO[prediction].iconName}" id="weather-icon-large"></i>`;
        lucide.createIcons();
        
        // Populate and animate probability bars
        const barsList = document.getElementById('prob-bars-list');
        barsList.innerHTML = '';
        
        const sortedProbs = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);
        sortedProbs.forEach(([className, value]) => {
            const row = document.createElement('div');
            row.className = 'prob-row';
            row.innerHTML = `
                <div class="prob-name">${className}</div>
                <div class="prob-bar-track">
                    <div class="prob-bar-fill" style="width: 0%;"></div>
                </div>
                <div class="prob-pct">${value}%</div>
            `;
            barsList.appendChild(row);
            
            setTimeout(() => {
                row.querySelector('.prob-bar-fill').style.width = `${value}%`;
            }, 50);
        });
        
        // Restore submit button
        submitBtn.disabled = false;
        submitBtnText.textContent = originalText;
        
        // Refresh local history
        loadHistory();
        
    }, 600);
}

// LOCAL STORAGE PERSISTENCE HELPERS
function saveToLocalStorage(temp, humidity, wind, pressure, prediction, confidence) {
    let history = [];
    const stored = localStorage.getItem('weather_detector_history');
    if (stored) {
        history = JSON.parse(stored);
    }
    
    const now = new Date();
    const timestamp = now.getFullYear() + '-' + 
                      String(now.getMonth()+1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0') + ' ' + 
                      String(now.getHours()).padStart(2, '0') + ':' + 
                      String(now.getMinutes()).padStart(2, '0') + ':' + 
                      String(now.getSeconds()).padStart(2, '0');
                      
    history.unshift({
        timestamp: timestamp,
        temperature: temp,
        humidity: humidity,
        wind_speed: wind,
        pressure: pressure,
        predicted_weather: prediction,
        confidence: confidence
    });
    
    // limit history size to 30 items
    if (history.length > 30) {
        history.pop();
    }
    
    localStorage.setItem('weather_detector_history', JSON.stringify(history));
}

function loadHistory() {
    const tbody = document.getElementById('history-tbody');
    const emptyState = document.getElementById('empty-history-state');
    const historyTable = document.getElementById('history-table');
    
    tbody.innerHTML = '';
    
    const stored = localStorage.getItem('weather_detector_history');
    let history = [];
    if (stored) {
        history = JSON.parse(stored);
    }
    
    if (history.length > 0) {
        emptyState.classList.add('hidden');
        historyTable.classList.remove('hidden');
        
        history.forEach(item => {
            const row = document.createElement('tr');
            const weatherLower = item.predicted_weather.toLowerCase();
            
            row.innerHTML = `
                <td>${item.timestamp}</td>
                <td><strong>${item.temperature} °C</strong></td>
                <td>${item.humidity}%</td>
                <td>${item.wind_speed} km/h</td>
                <td>${item.pressure} hPa</td>
                <td>
                    <span class="weather-table-badge badge-${weatherLower}">
                        <span class="badge-dot"></span>
                        ${item.predicted_weather}
                    </span>
                </td>
                <td><strong>${item.confidence}%</strong></td>
            `;
            tbody.appendChild(row);
        });
    } else {
        emptyState.classList.remove('hidden');
        historyTable.classList.add('hidden');
    }
}

function clearHistory() {
    if (confirm('Are you sure you want to clear your local session history?')) {
        localStorage.removeItem('weather_detector_history');
        loadHistory();
    }
}

// POPULATE MODEL STATISTICS STATIC PANELS
function loadModelStats() {
    // Populate parameters cards
    document.getElementById('model-algorithm').textContent = MODEL_STATS.model_info.algorithm;
    document.getElementById('model-trees').textContent = MODEL_STATS.model_info.n_estimators;
    document.getElementById('model-depth').textContent = MODEL_STATS.model_info.max_depth;
    document.getElementById('model-accuracy').textContent = `${MODEL_STATS.model_info.accuracy}%`;
    
    // Populate feature importances list
    const importanceList = document.getElementById('importance-list');
    importanceList.innerHTML = '';
    
    MODEL_STATS.feature_importances.forEach(item => {
        const featureRow = document.createElement('div');
        featureRow.className = 'importance-item';
        featureRow.innerHTML = `
            <div class="importance-meta">
                <span>${item.feature}</span>
                <span class="importance-val">${item.importance}%</span>
            </div>
            <div class="importance-track">
                <div class="importance-fill" style="width: ${item.importance}%;"></div>
            </div>
        `;
        importanceList.appendChild(featureRow);
    });
}

// CAROUSEL NAVIGATOR FOR EVALUATION PLOTS
function showSlide(idx) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    currentSlide = (idx + totalSlides) % totalSlides;
    
    slides.forEach((slide, i) => {
        if (i === currentSlide) {
            slide.classList.add('active');
            dots[i].classList.add('active');
        } else {
            slide.classList.remove('active');
            dots[i].classList.remove('active');
        }
    });
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

function setSlide(idx) {
    showSlide(idx);
}
