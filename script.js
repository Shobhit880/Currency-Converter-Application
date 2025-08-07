const form = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const weatherInfo = document.getElementById('weatherInfo');

const API_KEY = 'f5394c491e4cd9dc0081530bb276ef7b';

function showMessage(message, isError = false) {
    weatherInfo.innerHTML = `<p class="${isError ? 'placeholder' : ''}">${message}</p>`;
}

function renderWeather(data) {
    const weather = data.weather[0];
    const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
    weatherInfo.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="${iconUrl}" alt="${weather.description}" style="width:72px;" />
        <p><b>${Math.round(data.main.temp)}ºC</b></p>
        <p>${weather.main} (${weather.description})</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind: ${data.wind.speed} m/s</p>
    `;
}

async function fetchWeatherByCity(city) {
    showMessage('Loading...');
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
                city
            )}&appid=${API_KEY}&units=metric`
        );
        if (!res.ok) throw new Error('City not found');
        const data = await res.json();
        renderWeather(data);
    } catch (err) {
        showMessage('Could not get weather. Please check the city name.', true);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    showMessage('Loading...');
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        if (!res.ok) throw new Error('Weather not found');
        const data = await res.json();
        renderWeather(data);
    } catch (err) {
        showMessage('Could not get weather for your location.', true);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    }
});

// Auto-location detection on page load
window.addEventListener('DOMContentLoaded', () => {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            () => {
                showMessage('Please enter a city above to check the weather.');
            }
        );
    } else {
        showMessage('Geolocation unavailable. Search for a city above.');
    }
});
