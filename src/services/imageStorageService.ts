import { supabase } from '../config/supabase';
import { UnsplashImage } from './unsplashService';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

class ImageStorageService {
  private bucketName = 'uploads'; // Use existing bucket

  constructor() {
    // No need to initialize bucket since 'uploads' already exists
  }

  async uploadLocalFile(file: File, userId?: string): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'File must be an image' };
      }

      // Validate file size (5MB max)
      if (file.size > 5242880) {
        return { success: false, error: 'File size must be less than 5MB' };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = userId 
        ? `${userId}/${timestamp}_${randomString}.${fileExtension}`
        : `public/${timestamp}_${randomString}.${fileExtension}`;

      // Upload file
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Failed to upload image' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

  
      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: 'An error occurred while uploading the image' };
    }
  }

  async uploadFromUnsplash(image: UnsplashImage, userId: string): Promise<UploadResult> {
    try {
      // Download the image from Unsplash
      const response = await fetch(image.urls.regular);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a unique filename
      const fileName = `unsplash_${image.id}_${Date.now()}.jpg`;
      
      // Upload to Supabase
      const { error } = await supabase.storage
        .from('user-images')
        .upload(`${userId}/${fileName}`, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(`${userId}/${fileName}`);

      return {
        success: true,
        data: {
          id: fileName,
          name: fileName,
          url: urlData.publicUrl,
          size: blob.size,
          type: 'image/jpeg'
        }
      };
    } catch (error) {
      console.error('Error uploading from Unsplash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  async updateUserAvatar(userId: string, imageUrl: string, imagePath?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_url: imageUrl,
          avatar_path: imagePath || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user avatar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user avatar:', error);
      return false;
    }
  }

  async getUserImages(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(userId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error listing user images:', error);
        return [];
      }

      return data?.map(file => {
        const { data: urlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(`${userId}/${file.name}`);
        return urlData.publicUrl;
      }) || [];
    } catch (error) {
      console.error('Error getting user images:', error);
      return [];
    }
  }

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  generateThumbnail(url: string): string {
    // If using Supabase's image transformation (requires pro plan)
    // return `${url}?width=200&height=200&resize=cover`;
    
    // For now, return original URL
    return url;
  }
}

export const imageStorageService = new ImageStorageService();
export type { UploadResult };