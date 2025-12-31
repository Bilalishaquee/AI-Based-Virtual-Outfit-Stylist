# Backend API

Node.js + Express backend for AI Virtual Outfit Stylist.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
PORT=3001
OPENWEATHER_API_KEY=your-openweather-api-key
```

3. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Endpoints

- `GET /api/health` - Health check
- `GET /api/weather?city=NewYork` - Get weather data

## Environment Variables

- `PORT` - Server port (default: 3001)
- `OPENWEATHER_API_KEY` - OpenWeatherMap API key (optional, uses mock data if not provided)

