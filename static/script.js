document.addEventListener('DOMContentLoaded', () => {

    // --- NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.nav-links li');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active from all tabs
            navLinks.forEach(l => l.classList.remove('active'));
            // Remove active from all pages
            pages.forEach(p => p.classList.remove('active'));

            // Add active to clicked tab and corresponding page
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Re-fetch history if navigating to history
            if(targetId === 'page-history') fetchHistory();
        });
    });

    // --- WEATHER DASHBOARD ---
    const cityInput = document.getElementById('cityInput');
    const alertsOverlay = document.getElementById('alertsOverlay');

    function getWeatherIcon(condition, isDay=true) {
        condition = condition.toLowerCase();
        if(condition.includes('clear')) return isDay ? '<i class="fa-solid fa-sun text-yellow"></i>' : '<i class="fa-solid fa-moon text-yellow"></i>';
        if(condition.includes('cloud')) return '<i class="fa-solid fa-cloud text-blue"></i>';
        if(condition.includes('rain')) return '<i class="fa-solid fa-cloud-showers-heavy text-blue"></i>';
        if(condition.includes('thunderstorm')) return '<i class="fa-solid fa-cloud-bolt text-yellow"></i>';
        if(condition.includes('snow')) return '<i class="fa-solid fa-snowflake text-blue"></i>';
        if(condition.includes('mist') || condition.includes('fog')) return '<i class="fa-solid fa-smog"></i>';
        return '<i class="fa-solid fa-cloud"></i>';
    }

    function applyTheme(condition) {
        condition = condition.toLowerCase();
        
        // Use the browser's own local clock — no UTC or timezone offset math needed
        const localHour = new Date().getHours();
        const isDay = localHour >= 6 && localHour < 19;
        
        const bgLayer = document.getElementById('bg-layer');
        document.body.className = ''; // reset theme
        
        if (!isDay) {
            document.body.classList.add('theme-night');
            // Apply a night-specific background based on condition
            if (condition.includes('clear')) {
                bgLayer.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)';
            } else if (condition.includes('cloud')) {
                bgLayer.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
            } else if (condition.includes('rain') || condition.includes('drizzle')) {
                bgLayer.style.background = 'linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 100%)';
            } else if (condition.includes('thunderstorm')) {
                bgLayer.style.background = 'linear-gradient(135deg, #0f172a 0%, #450a0a 100%)';
            } else {
                bgLayer.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)';
            }
            return;
        }

        // Light Theme dynamic gradients
        if (condition.includes('clear')) {
            bgLayer.style.background = 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)';
        } else if (condition.includes('cloud')) {
            bgLayer.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
        } else if (condition.includes('rain') || condition.includes('drizzle')) {
            bgLayer.style.background = 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%)';
        } else if (condition.includes('thunderstorm')) {
            document.body.classList.add('theme-night'); // stormy looks better dark
            bgLayer.style.background = 'linear-gradient(135deg, #334155 0%, #0f172a 100%)';
        } else if (condition.includes('snow')) {
            bgLayer.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)';
        } else {
            // default mist/fog etc
            bgLayer.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
        }
    }

    function fetchAndRenderWeather(currentUrl, forecastUrl) {
        const alertsOverlay = document.getElementById('alertsOverlay');
        
        // Fetch Current Weather
        fetch(currentUrl)
            .then(res => res.json())
            .then(data => {
                alertsOverlay.innerHTML = ''; // clear old alerts
                
                if(data.error) {
                    // Fail silently or show alert if coords fail
                    if(data.error.includes('configured')) alert('Error: ' + data.error);
                    return;
                }

                document.getElementById('heroCity').textContent = data.city;
                document.getElementById('heroConditions').textContent = data.conditions.charAt(0).toUpperCase() + data.conditions.slice(1);
                document.getElementById('heroTemp').textContent = Math.round(data.temperature);
                
                const tempDateTimestamp = Math.floor(Date.now() / 1000);
                applyTheme(data.conditions);

                const iconHtml = getWeatherIcon(data.conditions, new Date().getHours() >= 6 && new Date().getHours() < 19);
                const heroIconParent = document.getElementById('heroIcon').parentElement;
                heroIconParent.innerHTML = `<span class="icon-giant" style="display:inline-block">${iconHtml}</span>`;

                document.getElementById('airRealFeel').textContent = Math.round(data.temperature) + '°';
                document.getElementById('airWind').textContent = data.wind_speed + ' m/s';
                document.getElementById('airHumidity').textContent = data.humidity + '%';
                document.getElementById('airRainfall').textContent = (data.rainfall || 0) + ' mm';

                if(data.alerts && data.alerts.length > 0) {
                    data.alerts.forEach(a => {
                        const div = document.createElement('div');
                        div.className = 'alert-box';
                        div.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${a}`;
                        alertsOverlay.appendChild(div);
                        setTimeout(() => div.remove(), 5000);
                    });
                }
            })
            .catch(console.error);

        // Fetch Forecast
        fetch(forecastUrl)
            .then(res => res.json())
            .then(data => {
                if(data.error) return;

                const list = data.list;
                if(!list) return;

                const hourlyContainer = document.getElementById('hourlyList');
                hourlyContainer.innerHTML = '';
                for(let i = 0; i < 6 && i < list.length; i++) {
                    const item = list[i];
                    const date = new Date(item.dt * 1000);
                    let hour = date.getHours();
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    hour = hour % 12;
                    hour = hour ? hour : 12;
                    
                    const condition = item.weather[0].main;
                    const temp = Math.round(item.main.temp);
                    
                    hourlyContainer.innerHTML += `
                        <div class="hourly-item">
                            <span class="time">${hour} ${ampm}</span>
                            ${getWeatherIcon(condition, (date.getHours() > 6 && date.getHours() < 19))}
                            <span class="temp">${temp}°</span>
                        </div>
                    `;
                }

                const weeklyContainer = document.getElementById('weeklyList');
                weeklyContainer.innerHTML = '';
                let dailyData = {};
                
                list.forEach(item => {
                    const dateRaw = new Date(item.dt * 1000);
                    const day = dateRaw.toLocaleDateString('en-US', { weekday: 'short' });
                    if(!dailyData[day]) {
                        dailyData[day] = { min: item.main.temp_min, max: item.main.temp_max, condition: item.weather[0].main };
                    } else {
                        if(item.main.temp_min < dailyData[day].min) dailyData[day].min = item.main.temp_min;
                        if(item.main.temp_max > dailyData[day].max) dailyData[day].max = item.main.temp_max;
                    }
                });

                const days = Object.keys(dailyData).slice(0, 5);
                days.forEach(day => {
                    const d = dailyData[day];
                    weeklyContainer.innerHTML += `
                        <div class="weekly-item">
                            <span>${day}</span>
                            <div class="forecast-icon">${getWeatherIcon(d.condition)}</div>
                            <span class="forecast-temps">${Math.round(d.min)}° / ${Math.round(d.max)}°</span>
                        </div>
                    `;
                });

            })
            .catch(console.error);
    }

    function searchWeather(city) {
        if(!city) return;
        const currentUrl = `/api/weather_live/${encodeURIComponent(city)}`;
        const forecastUrl = `/api/weather_forecast/${encodeURIComponent(city)}`;
        fetchAndRenderWeather(currentUrl, forecastUrl);
    }

    function searchWeatherByCoords(lat, lon) {
        const currentUrl = `/api/weather_live_coords?lat=${lat}&lon=${lon}`;
        const forecastUrl = `/api/weather_forecast_coords?lat=${lat}&lon=${lon}`;
        fetchAndRenderWeather(currentUrl, forecastUrl);
    }

    cityInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            searchWeather(cityInput.value.trim());
        }
    });

    // Try tracking location on boot
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                searchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                // If denied or failed, fallback to default
                searchWeather('New York');
            }
        );
    } else {
        searchWeather('New York');
    }

    // --- HISTORY TABLE ---
    function fetchHistory() {
        fetch('/api/weather')
            .then(res => res.json())
            .then(data => {
                const tbody = document.getElementById('historyTableBody');
                if(data.error) {
                    tbody.innerHTML = `<tr><td colspan="7" class="placeholder-text text-center text-red">Error: ${data.error}</td></tr>`;
                    return;
                }
                
                const records = data.data;
                if(!records || records.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="placeholder-text text-center">No historical data available.</td></tr>`;
                    return;
                }

                tbody.innerHTML = '';
                records.forEach(row => {
                    const dateRaw = new Date(row.record_date);
                    const formattedDate = dateRaw.toLocaleString();

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${row.city || 'Unknown'}</td>
                        <td>${row.station_name || 'N/A'}</td>
                        <td>${row.temperature}</td>
                        <td>${row.humidity}</td>
                        <td>${row.rainfall || 0}</td>
                        <td>${row.category_name || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }).catch(console.error);
    }

    // --- ADD RECORD FORM ---
    const weatherForm = document.getElementById('weatherForm');
    if(weatherForm) {
        weatherForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const payload = {
                station_id: document.getElementById('stationId').value,
                category_id: document.getElementById('categoryId').value || null,
                record_date: document.getElementById('recordDate').value,
                temperature: document.getElementById('temperature').value,
                humidity: document.getElementById('humidity').value,
                rainfall: document.getElementById('rainfall').value || 0,
                wind_speed: document.getElementById('windSpeed').value || 0,
                pressure: document.getElementById('pressure').value || null
            };

            const msgDiv = document.getElementById('formMsg');
            msgDiv.textContent = 'Submitting...';
            msgDiv.style.color = 'var(--text-muted)';

            fetch('/api/add_weather', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if(data.error) {
                    msgDiv.textContent = 'Error: ' + data.error;
                    msgDiv.style.color = 'var(--alert)';
                } else {
                    msgDiv.textContent = 'Record Added!';
                    msgDiv.style.color = 'var(--primary)';
                    weatherForm.reset();
                }
            }).catch(err => {
                msgDiv.textContent = 'Network Error.';
                msgDiv.style.color = 'var(--alert)';
            });
        });
    }

    // --- AI CHATBOT ---
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.classList.add('message', sender === 'user' ? 'user-msg' : 'ai-msg');
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if(chatSend && chatInput) {
        chatSend.addEventListener('click', () => {
            const msg = chatInput.value.trim();
            if(!msg) return;

            appendMessage(msg, 'user');
            chatInput.value = '';

            const typingId = 'typing-' + Date.now();
            const typingDiv = document.createElement('div');
            typingDiv.id = typingId;
            typingDiv.classList.add('message', 'ai-msg');
            typingDiv.innerHTML = '<i class="fa-solid fa-ellipsis"></i> Thinking...';
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            })
            .then(res => res.json())
            .then(data => {
                document.getElementById(typingId)?.remove();
                if(data.error) {
                    appendMessage('Error: ' + data.error, 'ai');
                } else {
                    appendMessage(data.response, 'ai');
                }
            }).catch(err => {
                document.getElementById(typingId)?.remove();
                appendMessage('Network error communicating with AI server.', 'ai');
            });
        });

        chatInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') chatSend.click();
        });
    }
});
