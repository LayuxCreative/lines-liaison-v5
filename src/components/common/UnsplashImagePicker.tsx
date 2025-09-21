import React, { useState, useEffect } from 'react';
import { Search, Download, User, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { unsplashService, UnsplashImage } from '../../services/unsplashService';

interface UnsplashImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: UnsplashImage) => void;
  searchQuery?: string;
}

const UnsplashImagePicker: React.FC<UnsplashImagePickerProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  searchQuery = 'people'
}) => {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadImages(searchTerm, 1);
    }
  }, [isOpen, searchTerm]);

  const loadImages = async (query: string, pageNum: number = 1) => {
    // Check if Unsplash API key is configured
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!accessKey || accessKey === 'your_unsplash_access_key_here') {
      setError('Unsplash API key not configured. Please add your API key to the .env file.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await unsplashService.searchPhotos(query, pageNum, 20);
      if (pageNum === 1) {
        setImages(response.results);
      } else {
        setImages(prev => [...prev, ...response.results]);
      }
      setHasMore(pageNum < response.total_pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading images:', error);
      if (error instanceof Error && error.message.includes('401')) {
        setError('Unsplash API key is missing. Please check UNSPLASH_SETUP.md for setup instructions.');
      } else {
        setError('Failed to load images. Please check your Unsplash API key and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      loadImages(searchTerm.trim(), 1);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadImages(searchTerm, page + 1);
    }
  };

  const handleImageSelect = (image: UnsplashImage) => {
    setSelectedImage(image);
    onSelectImage(image);
  };

  const confirmSelection = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      onClose();
    }
  };
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Select Image from Unsplash</h2>
                <p className="text-gray-600 mt-1">Choose from millions of high-quality photos</p>
              </div>
              <motion.button
                onClick={onClose}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for images..."
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Search
              </motion.button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-8 py-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3 text-red-700">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Images Grid */}
          <div className="p-8 overflow-y-auto max-h-[60vh] bg-gray-50">
            {loading && images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
                />
                <span className="text-gray-700 text-lg font-medium">Loading beautiful images...</span>
                <span className="text-gray-500 text-sm mt-1">Please wait a moment</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${
                        selectedImage?.id === image.id ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : 'hover:scale-105'
                      }`}
                      onClick={() => handleImageSelect(image)}
                      whileHover={{ y: -5 }}
                    >
                      <img
                        src={image.urls.small}
                        alt={image.alt_description || 'Unsplash Image'}
                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className="flex items-center text-white text-sm font-medium">
                          <User className="w-4 h-4 mr-2" />
                          <span className="truncate">{image.user.name}</span>
                        </div>
                      </div>
                      {selectedImage?.id === image.id && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 bg-blue-500/20 flex items-center justify-center backdrop-blur-sm"
                        >
                          <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <Download className="w-6 h-6 text-white" />
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <motion.button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8 py-4 bg-white border-2 border-gray-200 hover:border-blue-300 disabled:opacity-50 text-gray-700 hover:text-blue-600 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      {loading ? 'Loading...' : 'Load More Images'}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <motion.img
                    src={selectedImage.urls.thumb}
                    alt="Selected"
                    className="w-20 h-20 object-cover rounded-2xl shadow-lg ring-2 ring-blue-200"
                    whileHover={{ scale: 1.1 }}
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">Selected Image</p>
                    <p className="text-gray-600 flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      by {selectedImage.user.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setSelectedImage(null)}
                    className="px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={confirmSelection}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-5 h-5" />
                    Select This Image
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnsplashImagePicker;