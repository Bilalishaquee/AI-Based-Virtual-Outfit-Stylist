import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Sparkles, Shirt, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/wardrobe">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-purple-100 p-4 rounded-xl">
                    <Shirt className="w-8 h-8 text-purple-600" />
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
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-pink-100 p-4 rounded-xl">
                    <Sparkles className="w-8 h-8 text-pink-600" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold capitalize">{profile.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mood</p>
                <p className="font-semibold capitalize">{profile.mood}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Skin Tone</p>
                <p className="font-semibold">{profile.skinTone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Favorite Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: profile.favoriteColor }}
                  />
                  <p className="font-semibold">{profile.favoriteColor}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

