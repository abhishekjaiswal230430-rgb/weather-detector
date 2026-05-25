// GLOBAL STATE
let currentTab = 'predict';
let currentSlide = 0;
const totalSlides = 3;

// ON PAGE LOAD INITIALIZATIONS
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Set current date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load database history & model stats
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
        title.textContent = 'Weather Detector Dashboard';
        desc.textContent = 'Input meteorological parameters to predict local weather conditions using machine learning.';
    } else if (tabName === 'history') {
        title.textContent = 'Archived Predictions';
        desc.textContent = 'View and manage historical weather predictions recorded in the SQLite database.';
        loadHistory(); // Reload history when clicking tab
    } else if (tabName === 'model') {
        title.textContent = 'Random Forest Model Analytics';
        desc.textContent = 'Explore model specifications, classification performance metrics, and feature importances.';
        loadModelStats(); // Reload stats when clicking tab
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

// HANDLE PREDICTION API REQUEST
async function handlePrediction(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('predict-submit-btn');
    const submitBtnText = submitBtn.querySelector('span');
    const originalText = submitBtnText.textContent;
    
    // Show spinner/loading state
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Analyzing Atmosphere...';
    
    // Fetch values
    const payload = {
        temperature: parseFloat(document.getElementById('temperature-num').value),
        humidity: parseFloat(document.getElementById('humidity-num').value),
        wind_speed: parseFloat(document.getElementById('wind-num').value),
        pressure: parseFloat(document.getElementById('pressure-num').value)
    };
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display prediction panel
            document.getElementById('result-placeholder').classList.add('hidden');
            const resultData = document.getElementById('result-data');
            resultData.classList.remove('hidden');
            
            // Apply dynamic weather theme class to card
            const resultPanel = document.getElementById('result-panel');
            resultPanel.className = 'glass-card result-panel'; // Reset classes
            const weatherClass = data.prediction.toLowerCase();
            resultPanel.classList.add(`${weatherClass}-theme`);
            
            // Set prediction values
            document.getElementById('predicted-state').textContent = data.prediction;
            document.getElementById('confidence-val').textContent = `${data.confidence}% Match`;
            document.getElementById('weather-explanation').textContent = data.details;
            document.getElementById('weather-recommendation').textContent = data.recommendation;
            
            // Update icon dynamically
            const iconWrapper = document.getElementById('weather-icon-div');
            let iconName = 'sun'; // fallback
            if (data.prediction === 'Rainy') iconName = 'cloud-rain';
            else if (data.prediction === 'Cloudy') iconName = 'cloud';
            else if (data.prediction === 'Foggy') iconName = 'cloud-fog';
            else if (data.prediction === 'Stormy') iconName = 'cloud-lightning';
            
            iconWrapper.innerHTML = `<i data-lucide="${iconName}" id="weather-icon-large"></i>`;
            lucide.createIcons(); // Instantiates new icons
            
            // Update probabilities progress bars
            const barsList = document.getElementById('prob-bars-list');
            barsList.innerHTML = '';
            
            // Sort probabilities by percentage descending
            const probs = Object.entries(data.probabilities).sort((a, b) => b[1] - a[1]);
            
            probs.forEach(([className, percentage]) => {
                const row = document.createElement('div');
                row.className = 'prob-row';
                row.innerHTML = `
                    <div class="prob-name">${className}</div>
                    <div class="prob-bar-track">
                        <div class="prob-bar-fill" style="width: 0%;"></div>
                    </div>
                    <div class="prob-pct">${percentage}%</div>
                `;
                barsList.appendChild(row);
                
                // Animate bars on next frame
                setTimeout(() => {
                    row.querySelector('.prob-bar-fill').style.width = `${percentage}%`;
                }, 100);
            });
            
            // Refresh history in background
            loadHistory();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Prediction query failed:', error);
        alert('An error occurred while connecting to the machine learning server.');
    } finally {
        // Reset button loading state
        submitBtn.disabled = false;
        submitBtnText.textContent = originalText;
    }
}

// FETCH AND RENDER PREDICTION LOGS
async function loadHistory() {
    try {
        const response = await fetch('/history');
        const data = await response.json();
        
        const tbody = document.getElementById('history-tbody');
        const emptyState = document.getElementById('empty-history-state');
        const historyTable = document.getElementById('history-table');
        
        tbody.innerHTML = '';
        
        if (data.success && data.history.length > 0) {
            emptyState.classList.add('hidden');
            historyTable.classList.remove('hidden');
            
            data.history.forEach(item => {
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
    } catch (error) {
        console.error('Could not fetch prediction log history:', error);
    }
}

// CLEAR ALL LOGGED PREDICTIONS
async function clearHistory() {
    if (!confirm('Are you sure you want to permanently clear all logged prediction history?')) {
        return;
    }
    
    try {
        const response = await fetch('/history/clear', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            loadHistory();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Failed to clear prediction history:', error);
        alert('Could not clear prediction history.');
    }
}

// LOAD MODEL PARAMETERS & FEAT IMPORTANCE FROM BACKEND
async function loadModelStats() {
    try {
        const response = await fetch('/stats');
        const data = await response.json();
        
        if (data.success) {
            // Populate parameters cards
            document.getElementById('model-algorithm').textContent = data.model_info.algorithm;
            document.getElementById('model-trees').textContent = data.model_info.n_estimators;
            document.getElementById('model-depth').textContent = data.model_info.max_depth || 'Unlimited';
            
            // Populate feature importances list
            const importanceList = document.getElementById('importance-list');
            importanceList.innerHTML = '';
            
            data.feature_importances.forEach(item => {
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
            
            // Display the model accuracy from the API response
            document.getElementById('model-accuracy').textContent = `${data.model_info.accuracy}%`;
        }
    } catch (error) {
        console.error('Could not load model stats:', error);
    }
}

// CAROUSEL NAVIGATOR FOR EVALUATION PLOTS
function showSlide(idx) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    // Boundary check
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
