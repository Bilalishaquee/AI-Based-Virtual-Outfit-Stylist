import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { motion } from 'framer-motion';
import { LogOut, User, Shirt, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, profile } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-orange-600 to-brown-600 bg-clip-text text-transparent">
              <Sparkles className="w-8 h-8 text-orange-600" />
              AI Stylist
            </Link>

            <div className="hidden md:flex gap-4">
              <Link
                to="/wardrobe"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/wardrobe'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Shirt className="w-4 h-4" />
                Wardrobe
              </Link>
              <Link
                to="/outfits"
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/outfits'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Outfits
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{profile.email}</span>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}

