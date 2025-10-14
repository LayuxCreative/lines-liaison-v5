# Unsplash API Setup

## Problem
Getting a 401 error when trying to use the "Select Image from Unsplash" feature means the API key is missing or incorrect.

## Solution

### 1. Create a Developer Account on Unsplash
1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a new account or sign in
3. Go to [Your Apps](https://unsplash.com/oauth/applications)
4. Click "New Application"

### 2. Create a New Application
1. Read and agree to the terms and conditions
2. Enter application name (e.g., "Lines Liaison App")
3. Enter application description (e.g., "Communication platform with image selection")
4. Click "Create application"

### 3. Get API Key
1. On the application page, you'll find "Access Key"
2. Copy this key

### 4. Add Key to Project
1. Open the `.env` file in the project root
2. Add the API key:
```
VITE_UNSPLASH_ACCESS_KEY=your_actual_access_key_here
```
3. Save the file
4. Restart the server:
```bash
npm run dev
```

## Important Notes

### Usage Limits
- **Development mode**: 50 requests per hour (free)
- **Production mode**: Requires approval from Unsplash to increase limit

### Security
- Don't share your API key with anyone
- Don't put it in public source code
- Use environment variables only

### Troubleshooting
- **Error 401**: API key is incorrect or missing
- **Error 403**: Request limit exceeded
- **Error 404**: Image not found

## Testing Setup
1. Open the application in browser
2. Go to profile page
3. Click "Edit" for the image
4. Click "Select from Unsplash"
5. Images should appear without errors

## Useful Links
- [Unsplash API Documentation](https://unsplash.com/documentation)
- [Unsplash Developers](https://unsplash.com/developers)
- [API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)