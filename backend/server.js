import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your-api-key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { city = 'New York' } = req.query;

    // If no API key, return mock data
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'your-api-key') {
      return res.json({
        temp: 20,
        condition: 'clear',
        city: city,
        description: 'Clear sky',
      });
    }

    const response = await axios.get(WEATHER_BASE_URL, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric',
      },
    });

    const weatherData = response.data;
    const condition = weatherData.weather[0].main.toLowerCase();

    res.json({
      temp: Math.round(weatherData.main.temp),
      condition: condition,
      city: weatherData.name,
      description: weatherData.weather[0].description,
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    // Return mock data on error
    res.json({
      temp: 20,
      condition: 'clear',
      city: req.query.city || 'New York',
      description: 'Clear sky',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

