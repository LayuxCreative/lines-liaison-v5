interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
  width: number;
  height: number;
}

interface UnsplashSearchResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

class UnsplashService {
  private accessKey: string;
  private baseUrl = 'https://api.unsplash.com';

  constructor() {
    this.accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
    if (!this.accessKey) {
      console.warn('Unsplash Access Key not found. Please add VITE_UNSPLASH_ACCESS_KEY to your .env file');
    }
  }

  async searchPhotos(
    query: string = 'people',
    page: number = 1,
    perPage: number = 20
  ): Promise<UnsplashSearchResponse> {
    if (!this.accessKey) {
      throw new Error('Unsplash Access Key is required');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=portrait`,
        {
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
            'Accept-Version': 'v1'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching Unsplash photos:', error);
      throw error;
    }
  }

  async getRandomPhotos(
    count: number = 20,
    query?: string
  ): Promise<UnsplashImage[]> {
    if (!this.accessKey) {
      throw new Error('Unsplash Access Key is required');
    }

    try {
      const queryParam = query ? `&query=${encodeURIComponent(query)}` : '';
      const response = await fetch(
        `${this.baseUrl}/photos/random?count=${count}&orientation=portrait${queryParam}`,
        {
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
            'Accept-Version': 'v1'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting random Unsplash photos:', error);
      throw error;
    }
  }

  downloadPhoto(photoUrl: string): Promise<Blob> {
    console.log('downloadPhoto called with URL:', photoUrl);
    return fetch(photoUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    })
      .then(response => {
        console.log('Download response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        console.log('Downloaded blob size:', blob.size);
        return blob;
      })
      .catch(error => {
        console.error('Error downloading photo:', error);
        throw error;
      });
  }

  generateFileName(image: UnsplashImage): string {
    const timestamp = Date.now();
    const username = image.user.username;
    return `unsplash_${username}_${image.id}_${timestamp}.jpg`;
  }
}

export const unsplashService = new UnsplashService();
export type { UnsplashImage, UnsplashSearchResponse };