import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import SignUp from '../components/auth/SignUp';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Virtual Outfit Stylist
            </h1>
          </div>
          <p className="text-gray-600">Your personal fashion assistant powered by AI</p>
        </motion.div>

        {isLogin ? (
          <Login onSwitchToSignUp={() => setIsLogin(false)} onSuccess={handleSuccess} />
        ) : (
          <SignUp onSwitchToLogin={() => setIsLogin(true)} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}

