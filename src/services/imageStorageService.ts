/**
 * ImgBB Image Storage Service
 * Free image hosting service - https://imgbb.com/
 * 
 * Get your free API key at: https://api.imgbb.com/
 */

export interface ImageUploadResult {
  url: string;
  deleteUrl?: string; // ImgBB doesn't provide delete, but we store the URL for reference
}

/**
 * Upload an image to ImgBB
 * @param file - The image file to upload
 * @param userId - User ID for organization (stored in metadata)
 * @returns Promise with the image URL
 */
export const uploadImageToImgBB = async (
  file: File,
  userId?: string
): Promise<ImageUploadResult> => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error('ImgBB API key is not configured. Please add VITE_IMGBB_API_KEY to your .env file');
  }

  // Check file size (ImgBB free tier limit: 32MB)
  const maxSize = 32 * 1024 * 1024; // 32MB in bytes
  if (file.size > maxSize) {
    throw new Error(`Image size exceeds 32MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Create FormData
  const formData = new FormData();
  formData.append('image', file);
  
  // Add optional name with user ID for organization
  if (userId) {
    formData.append('name', `${userId}_${Date.now()}`);
  }

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Failed to upload image: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to upload image to ImgBB');
    }

    return {
      url: data.data.url, // Direct image URL
      deleteUrl: data.data.delete_url, // Delete URL (if available)
    };
  } catch (error: any) {
    console.error('ImgBB upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Note: ImgBB free tier doesn't provide a delete API
 * Images uploaded to ImgBB will remain until manually deleted
 * or until ImgBB's retention policy removes them
 */
export const deleteImageFromImgBB = async (imageUrl: string): Promise<void> => {
  // ImgBB free tier doesn't support programmatic deletion
  // The image will remain on ImgBB servers
  // We just remove the reference from our database
  console.warn('ImgBB free tier does not support image deletion. Image will remain on ImgBB servers.');
  console.warn('Image URL:', imageUrl);
};

