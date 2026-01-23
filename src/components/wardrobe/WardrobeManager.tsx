import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadWardrobeItem, getUserWardrobe, deleteWardrobeItem } from '../../services/wardrobeService';
import { extractDominantColor } from '../../utils/colorExtractor';
import { WardrobeItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Shirt, Square, Footprints, Watch, Loader, CheckCircle } from 'lucide-react';

interface FileWithPreview extends File {
  preview?: string;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
}

export default function WardrobeManager() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    category: 'top' as WardrobeItem['category'],
    files: [] as FileWithPreview[],
  });

  useEffect(() => {
    if (user) {
      loadWardrobe();
    }
  }, [user]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadData.files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

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
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const filesWithPreview: FileWithPreview[] = selectedFiles.map((file) => {
        const fileWithPreview = file as FileWithPreview;
        fileWithPreview.preview = URL.createObjectURL(file);
        fileWithPreview.uploadStatus = 'pending';
        return fileWithPreview;
      });
      setUploadData({ ...uploadData, files: [...uploadData.files, ...filesWithPreview] });
    }
    // Reset input to allow selecting the same files again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const file = uploadData.files[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    const newFiles = uploadData.files.filter((_, i) => i !== index);
    setUploadData({ ...uploadData, files: newFiles });
  };

  const clearAllFiles = () => {
    uploadData.files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadData({ ...uploadData, files: [] });
  };

  const handleUpload = async () => {
    if (!user || uploadData.files.length === 0) return;

    setUploading(true);
    const results = { success: 0, failed: 0 };

    try {
      // Process files sequentially to avoid overwhelming the API
      for (let i = 0; i < uploadData.files.length; i++) {
        const file = uploadData.files[i];
        
        // Update status to uploading
        setUploadData((prev) => ({
          ...prev,
          files: prev.files.map((f, idx) =>
            idx === i ? { ...f, uploadStatus: 'uploading' as const } : f
          ),
        }));

        try {
          // Create object URL for color extraction
          const objectUrl = URL.createObjectURL(file);
          const dominantColor = await extractDominantColor(objectUrl);
          URL.revokeObjectURL(objectUrl);

          // Use profile gender or default to unisex
          const itemGender = profile?.gender === 'male' ? 'male' : profile?.gender === 'female' ? 'female' : 'unisex';
          
          await uploadWardrobeItem(
            file,
            user.uid,
            uploadData.category,
            itemGender as WardrobeItem['gender'],
            dominantColor
          );

          // Update status to success
          setUploadData((prev) => ({
            ...prev,
            files: prev.files.map((f, idx) =>
              idx === i ? { ...f, uploadStatus: 'success' as const } : f
            ),
          }));
          results.success++;
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          // Update status to error
          setUploadData((prev) => ({
            ...prev,
            files: prev.files.map((f, idx) =>
              idx === i ? { ...f, uploadStatus: 'error' as const } : f
            ),
          }));
          results.failed++;
        }
      }

      // Show results
      if (results.failed === 0) {
        // All successful - close modal and refresh
        setTimeout(() => {
          clearAllFiles();
          setShowUpload(false);
          setUploadData({ category: 'top', gender: 'unisex', files: [] });
          loadWardrobe();
        }, 1000);
      } else {
        // Some failed - show message but keep modal open
        alert(`${results.success} uploaded successfully, ${results.failed} failed.`);
        // Refresh wardrobe to show successful uploads
        await loadWardrobe();
      }
    } catch (error) {
      console.error('Error in upload process:', error);
      alert('Failed to upload items');
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
      case 'outerwear':
        return <Shirt className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const filteredItems = {
    top: items.filter((item) => item.category === 'top'),
    bottom: items.filter((item) => item.category === 'bottom'),
    shoes: items.filter((item) => item.category === 'shoes'),
    outerwear: items.filter((item) => item.category === 'outerwear'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-orange-600" />
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
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
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
            className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Upload New Item</h3>
              <button
                onClick={() => {
                  clearAllFiles();
                  setShowUpload(false);
                  setUploadData({ category: 'top', files: [] });
                }}
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
                  <option value="outerwear">Outerwear</option>
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images {uploadData.files.length > 0 && `(${uploadData.files.length} selected)`}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can select multiple images at once
                </p>
              </div>

              {/* Selected Files Preview */}
              {uploadData.files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover rounded"
                        />
                        {file.uploadStatus === 'uploading' && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                            <Loader className="w-4 h-4 animate-spin text-white" />
                          </div>
                        )}
                        {file.uploadStatus === 'success' && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-50 rounded flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {file.uploadStatus === 'error' && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-50 rounded flex items-center justify-center">
                            <X className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {file.uploadStatus !== 'uploading' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploadData.files.length > 0 && (
                <button
                  onClick={clearAllFiles}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  Clear all
                </button>
              )}

              <button
                onClick={handleUpload}
                disabled={uploadData.files.length === 0 || uploading}
                className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {uploadData.files.length > 0 && `(${uploadData.files.length})`}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['top', 'bottom', 'shoes', 'outerwear'] as const).map((category) => (
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

