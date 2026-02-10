const weatherContainer = document.getElementById("weather-info");

export async function loadWeather() {
    try {
        const regionResponse = await fetch("data/regions.json");
        const regionData = await regionResponse.json();

        weatherContainer.innerHTML = "";

        for (const region of regionData.regions) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${region.latitude}&longitude=${region.longitude}&daily=temperature_2m_max,precipitation_sum&timezone=Africa%2FDar_es_Salaam`;

            const response = await fetch(url);
            if (!response.ok) throw new Error("Weather fetch failed");

            const data = await response.json();

            const card = document.createElement("div");
            card.classList.add("weather-card");

            card.innerHTML = `
        <h3>${region.name}</h3>
        <p><strong>Max Temperature:</strong> ${data.daily.temperature_2m_max[0]} °C</p>
        <p><strong>Rainfall:</strong> ${data.daily.precipitation_sum[0]} mm</p>
      `;

            weatherContainer.appendChild(card);
        }
    } catch (error) {
        weatherContainer.textContent = "Weather data unavailable.";
        console.error(error);
    }
}
const tempEl = document.getElementById("weather-temp");
const descEl = document.getElementById("weather-desc");
const forecastEl = document.getElementById("weather-forecast");
const alertEl = document.getElementById("weather-alert");
const alertText = document.getElementById("alert-text");
const iconEl = document.getElementById("weather-icon");

export async function loadWeather() {
    try {
        // Load regions
        const regionRes = await fetch("data/regions.json");
        const regionData = await regionRes.json();

        // Example: first region (you can later add dropdown)
        const region = regionData.regions[0];

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${region.latitude}&longitude=${region.longitude}&daily=temperature_2m_max,precipitation_sum&timezone=Africa%2FDar_es_Salaam`;

        const response = await fetch(url);
        const data = await response.json();

        const temp = data.daily.temperature_2m_max[0];
        const rain = data.daily.precipitation_sum[0];

        // Update UI
        tempEl.textContent = `${temp}°C`;

        if (rain > 10) {
            descEl.textContent = "Heavy Rain";
            forecastEl.textContent = "Not suitable for harvesting";
            iconEl.innerHTML = `<i class="fas fa-cloud-showers-heavy"></i>`;
            alertText.textContent = "Heavy rainfall expected. Take precautions!";
            alertEl.style.display = "flex";
        } else if (rain > 2) {
            descEl.textContent = "Light Rain";
            forecastEl.textContent = "Plan activities carefully";
            iconEl.innerHTML = `<i class="fas fa-cloud-rain"></i>`;
            alertText.textContent = "Light rainfall expected";
            alertEl.style.display = "flex";
        } else {
            descEl.textContent = "Clear Weather";
            forecastEl.textContent = "Good for harvesting";
            iconEl.innerHTML = `<i class="fas fa-sun"></i>`;
            alertText.textContent = "No weather alerts in your area";
            alertEl.style.display = "none";
        }
    } catch (error) {
        descEl.textContent = "Weather unavailable";
        console.error(error);
    }
}