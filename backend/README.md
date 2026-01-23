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
REPLICATE_API_TOKEN=your-replicate-api-token
```

**Getting Replicate API Token (Free):**
1. Visit https://replicate.com and sign up (free account with $5 credit)
2. Go to https://replicate.com/account/api-tokens
3. Copy your API token
4. Add it to `backend/.env` as `REPLICATE_API_TOKEN=your-token-here`

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
- `POST /api/generate-avatar` - Generate AI avatar using Replicate API (proxies to avoid CORS)

## Environment Variables

- `PORT` - Server port (default: 3001)
- `OPENWEATHER_API_KEY` - OpenWeatherMap API key (optional, uses mock data if not provided)
- `REPLICATE_API_TOKEN` - Replicate API token for AI avatar generation (required for AI avatar feature)

