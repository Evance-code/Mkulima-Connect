const weatherContainer = document.getElementById("weather-info");

export async function loadWeather() {
    const url =
        "https://api.open-meteo.com/v1/forecast?latitude=-6.8&longitude=39.2&daily=temperature_2m_max,precipitation_sum&timezone=Africa%2FDar_es_Salaam";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather fetch failed");
        }

        const data = await response.json();

        weatherContainer.innerHTML = `
      <div class="weather-card">
        <p><strong>Max Temperature:</strong> ${data.daily.temperature_2m_max[0]} °C</p>
        <p><strong>Rainfall:</strong> ${data.daily.precipitation_sum[0]} mm</p>
      </div>
    `;
    } catch (error) {
        weatherContainer.textContent = "Weather data unavailable.";
        console.error(error);
    }
}