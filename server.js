const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000; // Change this to your desired port

app.get('/weather', async (req, res) => {
    const cities = req.query.city.split(',');
    const forecasts = await Promise.all(cities.map(async city => {
        try {
            const coordinates = await getCoordinates(city);
            if (!coordinates) {
                return null;
            }
            const forecast = await getForecast(coordinates);
            return formatForecast(city, forecast);
        } catch (error) {
            console.error(`Error processing forecast for ${city}:`, error);
            return null;
        }
    }));
    const filteredForecasts = forecasts.filter(forecast => forecast !== null);
    res.json({ forecast: filteredForecasts });
});

async function getCoordinates(city) {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${city}&format=json`);
    const data = response.data;
    if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } else {
        return null;
    }
}

async function getForecast(coordinates) {
    const response = await axios.get(`https://api.weather.gov/points/${coordinates.lat},${coordinates.lon}`);
    const forecastUrl = response.data.properties.forecast;
    const forecastResponse = await axios.get(forecastUrl);
    const periods = forecastResponse.data.properties.periods;
    return periods.slice(0, 4); // Get forecast for current day and next 2 days
}

function formatForecast(city, forecast) {
    return {    
        name: city,
        detail: forecast.map(period => ({
            startTime: period.startTime,
            endTime: period.endTime,
            description: period.detailedForecast
        }))
    };
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
