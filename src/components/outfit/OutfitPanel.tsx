import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOutfitRecommendations, saveOutfitHistory, getOutfitHistory, getWeather } from '../../services/outfitService';
import { getUserWardrobe } from '../../services/wardrobeService';
import { OutfitRecommendation, WardrobeItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Heart, ShoppingBag, Sparkles, Loader, ArrowRightLeft } from 'lucide-react';
import AvatarCanvas from '../avatar/AvatarCanvas';
import { ErrorBoundary } from '../common/ErrorBoundary';

export default function OutfitPanel() {
  const { user, profile, updateProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [currentOutfit, setCurrentOutfit] = useState<OutfitRecommendation | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('casual');
  const [history, setHistory] = useState<any[]>([]);
  const [showSwap, setShowSwap] = useState<string | null>(null);
  
  // Color and mood preferences for this outfit generation (not stored in profile)
  const [currentMood, setCurrentMood] = useState(profile?.mood || 'casual');
  const [currentFavoriteColor, setCurrentFavoriteColor] = useState(profile?.favoriteColor || '#808080');
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    if (user && profile) {
      loadWardrobe();
      loadHistory();
      loadWeather();
    }
  }, [user, profile]);
  
  const loadWeather = async () => {
    try {
      const weatherData = await getWeather();
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading weather:', error);
    }
  };

  const loadWardrobe = async () => {
    if (!user) return;
    try {
      const items = await getUserWardrobe(user.uid);
      setWardrobeItems(items);
    } catch (error) {
      console.error('Error loading wardrobe:', error);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    try {
      const outfitHistory = await getOutfitHistory(user.uid, 10);
      setHistory(outfitHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const generateRecommendations = async () => {
    if (!user || !profile || wardrobeItems.length < 3) {
      alert('Please add at least 3 items to your wardrobe (top, bottom, shoes)');
      return;
    }

    setLoading(true);
    try {
      const recs = await getOutfitRecommendations(
        user.uid,
        profile.gender,
        currentMood, // Use current mood selection
        currentFavoriteColor, // Use current color selection
        eventType,
        wardrobeItems
      );

      setRecommendations(recs);
      if (recs.length > 0) {
        setCurrentOutfit(recs[0]);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const saveOutfit = async () => {
    if (!user || !currentOutfit) return;

    try {
      await saveOutfitHistory(user.uid, currentOutfit, eventType);
      await loadHistory();
      alert('Outfit saved to history!');
    } catch (error) {
      console.error('Error saving outfit:', error);
    }
  };

  const swapItem = (category: 'top' | 'bottom' | 'shoes' | 'outerwear', item: WardrobeItem) => {
    if (!currentOutfit) return;

    const updated = { ...currentOutfit };
    if (category === 'outerwear') {
      updated.outerwear = updated.outerwear || [];
      updated.outerwear.push(item);
    } else {
      (updated as any)[category] = item;
    }

    setCurrentOutfit(updated);
  };

  if (!profile) {
    return <div className="text-center py-12">Please complete your profile</div>;
  }

  // Event type descriptions
  const eventDescriptions: Record<string, string> = {
    casual: 'Everyday wear, comfortable and relaxed',
    formal: 'Business meetings, professional events',
    sporty: 'Active lifestyle, gym, sports activities',
    party: 'Evening events, celebrations, social gatherings',
    work: 'Office appropriate, business casual',
  };

  return (
    <div className="space-y-6">
      {/* Weather Display */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border-2 border-orange-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {weather.condition === 'clear' || weather.condition === 'sunny' ? '☀️' : 
                 weather.condition === 'rain' ? '🌧️' : 
                 weather.condition === 'clouds' ? '☁️' : '🌤️'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 capitalize">{weather.condition}</h3>
                <p className="text-2xl font-semibold text-gray-700">{weather.temp}°C</p>
                {weather.humidity && <p className="text-sm text-gray-600">{weather.humidity}% Humidity</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Clothing Recommendation</p>
              <p className="text-lg font-semibold text-orange-700">
                {weather.temp > 25 ? 'Light Clothing' : weather.temp < 15 ? 'Warm Clothing' : 'Moderate Clothing'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Outfit Stylist</h2>
          <p className="text-gray-600">Get personalized outfit recommendations</p>
        </div>

        {/* Preferences Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="casual">Casual - {eventDescriptions.casual}</option>
              <option value="formal">Formal - {eventDescriptions.formal}</option>
              <option value="sporty">Sporty - {eventDescriptions.sporty}</option>
              <option value="party">Party - {eventDescriptions.party}</option>
              <option value="work">Work - {eventDescriptions.work}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{eventDescriptions[eventType]}</p>
          </div>

          {/* Color Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Preference
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={currentFavoriteColor}
                onChange={(e) => setCurrentFavoriteColor(e.target.value)}
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <div
                  className="w-full h-10 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: currentFavoriteColor }}
                />
                <p className="text-xs text-gray-500 mt-1">Preferred outfit color</p>
              </div>
            </div>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood
            </label>
            <select
              value={currentMood}
              onChange={(e) => setCurrentMood(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="sporty">Sporty</option>
              <option value="elegant">Elegant</option>
              <option value="trendy">Trendy</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Your style mood for this outfit</p>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateRecommendations}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Get Recommendations
              </>
            )}
          </motion.button>
        </div>

        {currentOutfit && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ErrorBoundary>
                <AvatarCanvas
                  profile={profile}
                  outfit={currentOutfit}
                  onSkinToneChange={async (skinTone) => {
                    await updateProfile({ skinTone: skinTone as any });
                  }}
                  onHairStyleChange={async (hairStyle) => {
                    await updateProfile({ hairStyle });
                  }}
                />
              </ErrorBoundary>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Stylist Comment</h3>
                    <p className="text-gray-700">{currentOutfit.stylistComment}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Outfit Items</h3>
                <div className="space-y-3">
                  {currentOutfit.top && (
                    <div className="relative">
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <img
                          src={currentOutfit.top.imageUrl}
                          alt="top"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Top</p>
                          <p className="text-sm text-gray-500">{currentOutfit.top.dominantColor}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowSwap(showSwap === 'top' ? null : 'top')}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                        >
                          <ArrowRightLeft className="w-5 h-5" />
                        </motion.button>
                      </div>
                      {showSwap === 'top' && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                          <p className="text-xs text-gray-600 mb-2">Swap with:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {wardrobeItems
                              .filter((item) => item.category === 'top' && item.id !== currentOutfit.top?.id)
                              .map((item) => (
                                <motion.button
                                  key={item.id}
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => {
                                    swapItem('top', item);
                                    setShowSwap(null);
                                  }}
                                  className="relative"
                                >
                                  <img
                                    src={item.imageUrl}
                                    alt="swap"
                                    className="w-full h-16 object-cover rounded"
                                  />
                                </motion.button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentOutfit.bottom && (
                    <div className="relative">
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <img
                          src={currentOutfit.bottom.imageUrl}
                          alt="bottom"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Bottom</p>
                          <p className="text-sm text-gray-500">{currentOutfit.bottom.dominantColor}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowSwap(showSwap === 'bottom' ? null : 'bottom')}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                        >
                          <ArrowRightLeft className="w-5 h-5" />
                        </motion.button>
                      </div>
                      {showSwap === 'bottom' && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                          <p className="text-xs text-gray-600 mb-2">Swap with:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {wardrobeItems
                              .filter((item) => item.category === 'bottom' && item.id !== currentOutfit.bottom?.id)
                              .map((item) => (
                                <motion.button
                                  key={item.id}
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => {
                                    swapItem('bottom', item);
                                    setShowSwap(null);
                                  }}
                                  className="relative"
                                >
                                  <img
                                    src={item.imageUrl}
                                    alt="swap"
                                    className="w-full h-16 object-cover rounded"
                                  />
                                </motion.button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentOutfit.shoes && (
                    <div className="relative">
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <img
                          src={currentOutfit.shoes.imageUrl}
                          alt="shoes"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">Shoes</p>
                          <p className="text-sm text-gray-500">{currentOutfit.shoes.dominantColor}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowSwap(showSwap === 'shoes' ? null : 'shoes')}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                        >
                          <ArrowRightLeft className="w-5 h-5" />
                        </motion.button>
                      </div>
                      {showSwap === 'shoes' && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                          <p className="text-xs text-gray-600 mb-2">Swap with:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {wardrobeItems
                              .filter((item) => item.category === 'shoes' && item.id !== currentOutfit.shoes?.id)
                              .map((item) => (
                                <motion.button
                                  key={item.id}
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => {
                                    swapItem('shoes', item);
                                    setShowSwap(null);
                                  }}
                                  className="relative"
                                >
                                  <img
                                    src={item.imageUrl}
                                    alt="swap"
                                    className="w-full h-16 object-cover rounded"
                                  />
                                </motion.button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentOutfit.outerwear?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <img
                        src={item.imageUrl}
                        alt="outerwear"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">Outerwear</p>
                        <p className="text-sm text-gray-500">{item.dominantColor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveOutfit}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Save Outfit
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={generateRecommendations}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Regenerate
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Shop Similar
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {recommendations.length > 1 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">More Recommendations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {recommendations.slice(1).map((rec, idx) => (
                  <motion.button
                    key={rec.id || idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentOutfit(rec)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      currentOutfit?.id === rec.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="space-y-2">
                      {rec.top && (
                        <img
                          src={rec.top.imageUrl}
                          alt="top"
                          className="w-full h-20 object-cover rounded"
                        />
                      )}
                      <p className="text-xs text-gray-600 text-center">
                        Score: {(rec.score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Outfit History</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {history.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => setCurrentOutfit(item.outfit)}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-purple-300 bg-white"
              >
                {item.outfit.top && (
                  <img
                    src={item.outfit.top.imageUrl}
                    alt="outfit"
                    className="w-full h-24 object-cover rounded"
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(item.savedAt).toLocaleDateString()}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

