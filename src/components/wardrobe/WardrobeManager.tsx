import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadWardrobeItem, getUserWardrobe, deleteWardrobeItem } from '../../services/wardrobeService';
import { extractDominantColor } from '../../utils/colorExtractor';
import { WardrobeItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Shirt, Square, Footprints, Watch, Loader } from 'lucide-react';

export default function WardrobeManager() {
  const { user } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    category: 'top' as WardrobeItem['category'],
    gender: 'unisex' as WardrobeItem['gender'],
    file: null as File | null,
  });

  useEffect(() => {
    if (user) {
      loadWardrobe();
    }
  }, [user]);

  const loadWardrobe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const wardrobeItems = await getUserWardrobe(user.uid);
      setItems(wardrobeItems);
    } catch (error) {
      console.error('Error loading wardrobe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData({ ...uploadData, file });
    }
  };

  const handleUpload = async () => {
    if (!user || !uploadData.file) return;

    setUploading(true);
    try {
      // Create object URL for color extraction
      const objectUrl = URL.createObjectURL(uploadData.file);
      const dominantColor = await extractDominantColor(objectUrl);
      URL.revokeObjectURL(objectUrl);

      await uploadWardrobeItem(
        uploadData.file,
        user.uid,
        uploadData.category,
        uploadData.gender,
        dominantColor
      );

      setShowUpload(false);
      setUploadData({ category: 'top', gender: 'unisex', file: null });
      await loadWardrobe();
    } catch (error) {
      console.error('Error uploading item:', error);
      alert('Failed to upload item');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteWardrobeItem(itemId);
      await loadWardrobe();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'top':
        return <Shirt className="w-5 h-5" />;
      case 'bottom':
        return <Square className="w-5 h-5" />;
      case 'shoes':
        return <Footprints className="w-5 h-5" />;
      case 'accessories':
        return <Watch className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const filteredItems = {
    top: items.filter((item) => item.category === 'top'),
    bottom: items.filter((item) => item.category === 'bottom'),
    shoes: items.filter((item) => item.category === 'shoes'),
    accessories: items.filter((item) => item.category === 'accessories'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Wardrobe</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUpload(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Add Item
        </motion.button>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Upload New Item</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={uploadData.gender}
                  onChange={(e) => setUploadData({ ...uploadData, gender: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!uploadData.file || uploading}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['top', 'bottom', 'shoes', 'accessories'] as const).map((category) => (
          <div key={category} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              {getCategoryIcon(category)}
              <h3 className="font-semibold text-gray-800 capitalize">{category}</h3>
              <span className="ml-auto text-sm text-gray-500">
                {filteredItems[category].length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence>
                {filteredItems[category].map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.category}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

