# ML Recommendation Service

Flask microservice for AI-powered outfit recommendations.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python app.py
```

The service will run on `http://localhost:5000`

## Endpoints

- `GET /health` - Health check
- `POST /recommend` - Get outfit recommendations

### Recommend Endpoint

Request body:
```json
{
  "gender": "male",
  "mood": "casual",
  "favoriteColor": "#6366f1",
  "weather": "clear",
  "eventType": "casual",
  "wardrobeItems": [...]
}
```

Response:
```json
{
  "recommendations": [...],
  "count": 5
}
```

