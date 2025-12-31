# AI-Based Virtual Outfit Stylist

A modern web application that uses AI to recommend personalized outfit combinations with 2D avatar visualization.

## Features

- 🔐 **Firebase Authentication** - Secure user sign up and login
- 👔 **Wardrobe Management** - Upload and categorize clothing items
- 🤖 **AI Recommendations** - ML-powered outfit suggestions based on preferences
- 👤 **2D Avatar Visualization** - Try on outfits with customizable avatar
- 📱 **Responsive Design** - Beautiful UI with Framer Motion animations
- ☁️ **Cloud Storage** - Firebase Storage for images
- 📊 **Outfit History** - Save and revisit favorite outfits

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Fabric.js (2D Canvas)
- React Router

### Backend
- Node.js + Express
- Python + Flask (ML Service)
- Firebase (Auth, Firestore, Storage)
- OpenWeatherMap API

## Setup Instructions

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_BACKEND_URL=http://localhost:3001
VITE_ML_SERVICE_URL=http://localhost:5000

# Run development server
npm run dev
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
PORT=3001
OPENWEATHER_API_KEY=your-openweather-api-key

# Run server
npm start
```

### 3. ML Service Setup

```bash
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Run service
python app.py
```

### 4. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Update environment variables with your Firebase config

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── auth/          # Login, SignUp components
│   │   ├── avatar/        # AvatarCanvas component
│   │   ├── layout/        # Navbar, ProtectedRoute
│   │   ├── outfit/        # OutfitPanel component
│   │   └── wardrobe/      # WardrobeManager component
│   ├── config/            # Firebase configuration
│   ├── context/           # AuthContext
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── backend/               # Node.js Express API
├── ml-service/            # Python Flask ML service
└── README.md
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables

### ML Service (Render)
1. Create a new Web Service on Render
2. Set runtime: Python 3
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`
5. Update frontend ML_SERVICE_URL to Render URL

## Usage

1. **Sign Up/Login** - Create an account or login
2. **Complete Profile** - Set your preferences (gender, mood, favorite color, etc.)
3. **Add Wardrobe Items** - Upload images of your clothing items
4. **Get Recommendations** - Let AI suggest outfit combinations
5. **Try On** - See outfits on your 2D avatar
6. **Save Favorites** - Save outfits to your history

## License

MIT

