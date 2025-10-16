import React, { useState, useRef } from 'react';
import { Upload, Image, Camera, Loader2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnsplashImagePicker from './UnsplashImagePicker';
import { imageStorageService, UploadResult } from '../../services/storageService';
import { UnsplashImage, unsplashService } from '../../services/unsplashService';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageUpload: (result: UploadResult) => void;
  userId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square' | 'rounded';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl,
  onImageUpload,
  userId,
  className = '',
  size = 'md',
  shape = 'circle'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await imageStorageService.uploadImage(
        file,
        'files',
        `avatars/${userId ?? 'unknown'}/`
      );

      onImageUpload(result);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setError('An error occurred while uploading the image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUnsplashSelect = async (image: UnsplashImage) => {
    setIsUploading(true);
    setError(null);
    setShowUnsplashPicker(false);

    try {
      // Download photo as Blob then upload to storage
      const blob = await unsplashService.downloadPhoto(image.urls.regular);
      const filename = unsplashService.generateFileName(image);
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

      const result = await imageStorageService.uploadImage(
        file,
        'files',
        `avatars/${userId ?? 'unsplash'}/`
      );

      onImageUpload(result);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (error) {
      console.error('Unsplash upload error:', error);
      setError('An error occurred while uploading image from Unsplash');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container */}
      <div 
        className={`relative ${sizeClasses[size]} ${shapeClasses[shape]} overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-3 border-dashed border-gray-300 hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-xl`}
        onClick={triggerFileInput}
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Current avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        )}

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/70 to-purple-600/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <span className="text-white text-xs font-medium">Uploading...</span>
            </div>
          ) : uploadSuccess ? (
            <div className="flex flex-col items-center gap-2">
              <Check className="w-8 h-8 text-green-300" />
              <span className="text-green-300 text-xs font-medium">Success</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-white" />
              <span className="text-white text-xs font-medium">Click to Upload</span>
            </div>
          )}
        </div>

        {/* Success Indicator */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-500/30 flex items-center justify-center backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <Check className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Options */}
      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-3">
        {/* Local Upload Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            triggerFileInput();
          }}
          disabled={isUploading}
          className="w-11 h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-white"
          title="Upload from Device"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Upload className="w-5 h-5 text-white" />
        </motion.button>

        {/* Unsplash Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setShowUnsplashPicker(true);
          }}
          disabled={isUploading}
          className="w-11 h-11 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-white"
          title="Select from Unsplash"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsplash Image Picker Modal */}
      <UnsplashImagePicker
        isOpen={showUnsplashPicker}
        onClose={() => setShowUnsplashPicker(false)}
        onSelectImage={handleUnsplashSelect}
        searchQuery="people portrait"
      />
    </div>
  );
};

export default ImageUploader;