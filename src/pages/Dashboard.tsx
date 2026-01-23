import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Sparkles, Shirt, TrendingUp, Cloud, Thermometer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getWeather } from '../services/outfitService';

export default function Dashboard() {
  const { profile } = useAuth();
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const weatherData = await getWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading weather:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-50 via-peach-50 to-orange-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome back, {profile?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 text-lg">
            Let's create some amazing outfits together
          </p>
        </div>

        {/* Weather Widget */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl shadow-lg p-6 border-2 border-orange-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white p-4 rounded-xl">
                  {weather.condition === 'clear' || weather.condition === 'sunny' ? '☀️' : 
                   weather.condition === 'rain' ? '🌧️' : 
                   weather.condition === 'clouds' ? '☁️' : '🌤️'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 capitalize">{weather.condition}</h3>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    <p className="text-2xl font-semibold text-gray-700">{weather.temp}°C</p>
                  </div>
                  {weather.humidity && (
                    <div className="flex items-center gap-2 mt-1">
                      <Cloud className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-gray-600">{weather.humidity}% Humidity</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 mb-1">Today's Recommendation</p>
                <p className="text-lg font-semibold text-orange-700">
                  {weather.temp > 25 ? 'Light & Breezy' : weather.temp < 15 ? 'Warm & Cozy' : 'Comfortable Layers'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/wardrobe">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-orange-100 p-4 rounded-xl">
                    <Shirt className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">My Wardrobe</h2>
                </div>
                <p className="text-gray-600">
                  Manage your clothing items and build your digital wardrobe
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/outfits">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-brown-100 p-4 rounded-xl">
                    <Sparkles className="w-8 h-8 text-brown-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">AI Outfits</h2>
                </div>
                <p className="text-gray-600">
                  Get AI-powered outfit recommendations and try them on your avatar
                </p>
              </div>
            </Link>
          </motion.div>
        </div>

        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Style Profile
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold capitalize">{profile.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Skin Tone</p>
                <p className="font-semibold">{profile.skinTone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hair Style</p>
                <p className="font-semibold capitalize">{profile.hairStyle || 'Not set'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              Note: Color preference and mood are selected when generating outfits
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

