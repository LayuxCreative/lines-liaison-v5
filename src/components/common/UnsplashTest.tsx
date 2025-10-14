import React, { useState } from 'react';
import { unsplashService } from '../../services/unsplashService';
import { imageStorageService } from '../../services/storageService';

const UnsplashTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const testUnsplashDownload = async () => {
    setStatus('Testing...');
    setError(null);
    setImageUrl(null);

    try {
      // Test 1: Search for photos
      setStatus('Searching for photos...');
      const searchResult = await unsplashService.searchPhotos('portrait', 1, 1);
      
      if (searchResult.results.length === 0) {
        throw new Error('No photos found');
      }

      const testImage = searchResult.results[0];

      // Test 2: Download photo
      setStatus('Downloading photo...');
      await unsplashService.downloadPhoto(testImage.urls.regular);

      // Test 3: Upload to Supabase
      setStatus('Uploading to Supabase...');
      const uploadResult = await imageStorageService.uploadFromUnsplash(testImage, 'admin-user');

      if (uploadResult.success) {
        setImageUrl(uploadResult.url!);
        setStatus('Success!');
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('Failed');
    }
  };

  return (
    <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">Unsplash Integration Test</h2>
      
      <button 
        onClick={testUnsplashDownload}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 mb-4 disabled:opacity-50"
        disabled={status === 'Testing...'}
      >
        Test Unsplash Download
      </button>
      
      <div className="mb-4 text-gray-300">
        <strong className="text-white">Status:</strong> {status}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {imageUrl && (
        <div className="mb-4">
          <strong className="text-white">Result:</strong>
          <img src={imageUrl} alt="Test" className="w-full mt-2 rounded-lg border border-gray-600" />
        </div>
      )}
    </div>
  );
};

export default UnsplashTest;