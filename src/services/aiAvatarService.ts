/**
 * AI Avatar Generation Service using Replicate API
 * Generates realistic avatars wearing recommended clothes
 * Uses backend proxy to avoid CORS issues
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface AvatarGenerationOptions {
  skinTone: string;
  gender: string;
  hairStyle?: string;
  clothingImages: {
    top?: { imageUrl: string; dominantColor?: string };
    bottom?: { imageUrl: string; dominantColor?: string };
    shoes?: { imageUrl: string; dominantColor?: string };
    outerwear?: Array<{ imageUrl: string; dominantColor?: string }>;
  };
}

/**
 * Convert image URL to base64 for API
 */
const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/... prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Get color name from hex code for better prompts
 */
const getColorName = (hex: string): string => {
  // Expanded color mapping for better prompt generation
  const colorMap: Record<string, string> = {
    '#000000': 'black',
    '#ffffff': 'white',
    '#ff0000': 'red',
    '#0000ff': 'blue',
    '#00ff00': 'green',
    '#ffff00': 'yellow',
    '#ff00ff': 'magenta',
    '#808080': 'gray',
    '#c0c0c0': 'silver',
    '#ffa500': 'orange',
    '#800080': 'purple',
    '#a52a2a': 'brown',
    '#ffc0cb': 'pink',
    '#008000': 'dark green',
    '#000080': 'navy blue',
    '#800000': 'maroon',
    '#808000': 'olive',
  };
  
  const normalized = hex.toLowerCase().trim();
  
  // Exact match
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }
  
  // Try to approximate color from hex
  if (normalized.startsWith('#')) {
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    
    // Simple color approximation
    if (r > 200 && g > 200 && b > 200) return 'light colored';
    if (r < 50 && g < 50 && b < 50) return 'dark colored';
    if (r > g && r > b) return 'reddish';
    if (g > r && g > b) return 'greenish';
    if (b > r && b > g) return 'bluish';
    if (r > 150 && g > 150 && b < 100) return 'yellowish';
  }
  
  return 'colored';
};

/**
 * Build clothing description from outfit items
 */
const buildClothingDescription = (options: AvatarGenerationOptions): string => {
  const parts: string[] = [];
  
  if (options.clothingImages.top) {
    const color = getColorName(options.clothingImages.top.dominantColor || '#808080');
    parts.push(`wearing a ${color} top, ${color} shirt, ${color} blouse, or ${color} t-shirt`);
  }
  
  if (options.clothingImages.bottom) {
    const color = getColorName(options.clothingImages.bottom.dominantColor || '#808080');
    parts.push(`wearing ${color} pants, ${color} trousers, or ${color} jeans`);
  }
  
  if (options.clothingImages.shoes) {
    const color = getColorName(options.clothingImages.shoes.dominantColor || '#808080');
    parts.push(`wearing ${color} shoes or ${color} footwear`);
  }
  
  if (options.clothingImages.outerwear && options.clothingImages.outerwear.length > 0) {
    parts.push('wearing outerwear, jacket, or coat');
  }
  
  return parts.join(', ');
};

/**
 * Generate avatar image using Replicate API (Stable Diffusion SDXL)
 * The avatar will be generated wearing the clothing items from the outfit
 */
export const generateAvatarWithClothes = async (
  options: AvatarGenerationOptions
): Promise<string> => {
  // Build detailed prompt
  const skinToneMap: Record<string, string> = {
    Fair: 'fair',
    Medium: 'medium',
    Dark: 'dark',
  };
  
  const skinTone = skinToneMap[options.skinTone] || 'medium';
  const gender = options.gender || 'person';
  const hairStyle = options.hairStyle || 'short';
  const clothingDesc = buildClothingDescription(options);

  const prompt = `full body fashion photography of a ${gender} model, ${skinTone} skin tone, ${hairStyle} hair, ${clothingDesc}, standing pose, neutral white background, professional studio lighting, high quality, 4k, realistic, detailed clothing, fashion magazine style, wearing the complete outfit, outfit styling, fashion model, professional photography`;

  try {
    // Use backend proxy to avoid CORS issues
    const response = await fetch(`${BACKEND_URL}/api/generate-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        parameters: {
          num_inference_steps: 25,
          guidance_scale: 7.5,
          width: 512,
          height: 768, // Portrait orientation for full body
        },
      }),
    });

    // Handle different response types
    if (response.status === 503) {
      // Model is loading
      throw new Error('Model is loading. Please wait a moment and try again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate avatar' }));
      throw new Error(errorData.error || 'Failed to generate avatar');
    }

    // Response should be an image
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error('Error generating avatar with AI:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('loading')) {
      throw new Error('AI model is starting up. Please wait 10-20 seconds and try again.');
    }
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      throw new Error('API rate limit reached. Please try again later or upgrade your plan.');
    }
    
    if (error.message.includes('not configured') || error.message.includes('API token')) {
      throw new Error('Replicate API token is not configured in backend. Please add REPLICATE_API_TOKEN to backend/.env. See README for setup instructions.');
    }
    
    if (error.message.includes('credits') || error.message.includes('Insufficient')) {
      throw new Error('Insufficient Replicate credits. Please add credits to your account at https://replicate.com/account');
    }
    
    throw new Error(`Failed to generate AI avatar: ${error.message}`);
  }
};

/**
 * Check if AI avatar generation is available
 * Note: We check backend availability instead of API key directly
 */
export const isAIAvatarAvailable = (): boolean => {
  // Always return true - backend will handle API key validation
  // The backend will return appropriate errors if API key is missing
  return true;
};

/**
 * Generate a simpler prompt-based avatar (fallback)
 */
export const generateSimpleAvatar = async (
  skinTone: string,
  gender: string,
  hairStyle: string = 'short'
): Promise<string> => {
  const skinToneMap: Record<string, string> = {
    Fair: 'fair',
    Medium: 'medium',
    Dark: 'dark',
  };
  
  const prompt = `full body photo of a ${gender} person, ${skinToneMap[skinTone] || 'medium'} skin tone, ${hairStyle} hair, casual clothing, standing pose, neutral background, high quality, realistic`;

  try {
    const response = await fetch(`${BACKEND_URL}/api/generate-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate avatar' }));
      throw new Error(errorData.error || 'Failed to generate avatar');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error('Error generating simple avatar:', error);
    throw error;
  }
};

