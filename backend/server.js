import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your-api-key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Replicate API configuration - trim whitespace
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN?.trim() || '';
const REPLICATE_API_URL = 'https://api.replicate.com/v1';

// Log configuration status on startup (hide sensitive data)
console.log('Backend Configuration:');
console.log('- PORT:', PORT);
console.log('- REPLICATE_API_TOKEN:', REPLICATE_API_TOKEN ? `${REPLICATE_API_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('- WEATHER_API_KEY:', WEATHER_API_KEY && WEATHER_API_KEY !== 'your-api-key' ? 'SET' : 'NOT SET');

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { city = 'New York' } = req.query;

    // If no API key, return mock data
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'your-api-key') {
      return res.json({
        temp: 20,
        condition: 'clear',
        city: city,
        description: 'Clear sky',
      });
    }

    const response = await axios.get(WEATHER_BASE_URL, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric',
      },
    });

    const weatherData = response.data;
    const condition = weatherData.weather[0].main.toLowerCase();

    res.json({
      temp: Math.round(weatherData.main.temp),
      condition: condition,
      city: weatherData.name,
      description: weatherData.weather[0].description,
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    // Return mock data on error
    res.json({
      temp: 20,
      condition: 'clear',
      city: req.query.city || 'New York',
      description: 'Clear sky',
    });
  }
});

// AI Avatar Generation endpoint using Replicate API
app.post('/api/generate-avatar', async (req, res) => {
  try {
    const { prompt, parameters } = req.body;

    // Check if API token is configured
    if (!REPLICATE_API_TOKEN || REPLICATE_API_TOKEN === '' || REPLICATE_API_TOKEN === 'your-api-token') {
      console.error('Replicate API token validation failed:', {
        exists: !!process.env.REPLICATE_API_TOKEN,
        length: process.env.REPLICATE_API_TOKEN?.length || 0,
        trimmed: REPLICATE_API_TOKEN?.length || 0
      });
      return res.status(400).json({ 
        error: 'Replicate API token is not configured. Please add REPLICATE_API_TOKEN to backend/.env file and restart the server. See README for setup instructions.' 
      });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log('Avatar generation request received:', {
      promptLength: prompt.length,
      hasParameters: !!parameters,
      apiTokenConfigured: !!REPLICATE_API_TOKEN,
      apiTokenLength: REPLICATE_API_TOKEN.length,
      apiTokenPrefix: REPLICATE_API_TOKEN.substring(0, 8) + '...'
    });

    // Replicate API uses a prediction system: create prediction, then poll for result
    // Using SDXL Turbo for faster and cheaper generation (costs ~50% less than SDXL)
    // Alternative: Use 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' for higher quality
    const modelVersion = 'stability-ai/sdxl-turbo:af771c10776b8b7e3c8c893af65e38b6e8e02238e6f49067b8e34e76b84a4b0';
    
    const width = parameters?.width || 512;
    const height = parameters?.height || 768;
    // Reduced steps for SDXL Turbo (it works well with fewer steps, making it cheaper)
    const numInferenceSteps = parameters?.num_inference_steps || 20; // Reduced from 25
    const guidanceScale = parameters?.guidance_scale || 7.5;
    
    console.log('Creating Replicate prediction:', {
      model: modelVersion,
      promptLength: prompt.length,
      width,
      height,
      numInferenceSteps,
      guidanceScale
    });
    
    // Step 1: Create prediction
    let prediction;
    try {
      const createResponse = await axios.post(
        `${REPLICATE_API_URL}/predictions`,
        {
          version: modelVersion,
          input: {
            prompt: prompt,
            width: width,
            height: height,
            num_inference_steps: numInferenceSteps,
            guidance_scale: guidanceScale,
            negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, bad proportions',
          }
        },
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds for creating prediction
        }
      );
      
      prediction = createResponse.data;
      console.log('Prediction created:', prediction.id, 'Status:', prediction.status);
    } catch (error) {
      console.error('Error creating Replicate prediction:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Replicate API token. Please check your REPLICATE_API_TOKEN in backend/.env file.');
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient credits. You need to add credits to your Replicate account. New accounts get $5 free credits - visit https://replicate.com/account to claim them. If you\'ve used them up, add more credits at https://replicate.com/account/billing');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      throw new Error(`Failed to create prediction: ${error.response?.data?.detail || error.message}`);
    }
    
    // Step 2: Poll for prediction result
    const maxPollAttempts = 60; // 60 attempts
    const pollInterval = 2000; // 2 seconds between polls
    let pollAttempts = 0;
    
    while (pollAttempts < maxPollAttempts) {
      try {
        const statusResponse = await axios.get(
          `${REPLICATE_API_URL}/predictions/${prediction.id}`,
          {
            headers: {
              'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            },
            timeout: 10000,
          }
        );
        
        const currentPrediction = statusResponse.data;
        console.log(`Poll attempt ${pollAttempts + 1}: Status = ${currentPrediction.status}`);
        
        if (currentPrediction.status === 'succeeded') {
          // Get the image URL from output
          const imageUrl = currentPrediction.output;
          
          if (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) {
            throw new Error('Prediction succeeded but no image URL returned');
          }
          
          // Handle array of URLs (some models return multiple images)
          const finalImageUrl = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
          
          console.log('Prediction succeeded! Image URL:', finalImageUrl);
          
          // Step 3: Fetch the image and return it
          const imageResponse = await axios.get(finalImageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
          });
          
          // Set appropriate headers for image response
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Length', imageResponse.data.length);
          res.send(Buffer.from(imageResponse.data));
          return;
          
        } else if (currentPrediction.status === 'failed' || currentPrediction.status === 'canceled') {
          const errorMsg = currentPrediction.error || 'Prediction failed';
          console.error('Prediction failed:', errorMsg);
          throw new Error(`Image generation failed: ${errorMsg}`);
        } else if (currentPrediction.status === 'starting' || currentPrediction.status === 'processing') {
          // Still processing, wait and poll again
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          pollAttempts++;
          continue;
        } else {
          // Unknown status
          console.warn('Unknown prediction status:', currentPrediction.status);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          pollAttempts++;
          continue;
        }
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('Prediction not found. It may have expired or been deleted.');
        }
        // For other errors, continue polling
        console.warn('Error polling prediction status:', error.message);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollAttempts++;
      }
    }
    
    // If we've exhausted all polling attempts
    throw new Error('Image generation timed out. The prediction is still processing. Please try again later.');
  } catch (error) {
    console.error('Replicate API error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Extract detailed error information
    let errorMessage = error.message || 'Failed to generate avatar';
    let statusCode = 500;
    
    if (error.response) {
      statusCode = error.response.status || 500;
      
      // Try to parse error response
      try {
        const errorData = error.response.data;
        errorMessage = errorData?.detail || errorData?.error || errorData?.message || errorMessage;
        
        // Handle specific status codes
        if (statusCode === 401) {
          errorMessage = 'Invalid Replicate API token. Please check your REPLICATE_API_TOKEN in backend/.env file.';
        } else if (statusCode === 402) {
          errorMessage = 'Insufficient credits. New accounts get $5 free credits - visit https://replicate.com/account to claim them. If used up, add credits at https://replicate.com/account/billing';
        } else if (statusCode === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        }
      } catch (parseError) {
        // If parsing fails, use the error message we have
        console.error('Error parsing response:', parseError);
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from Replicate API. Please check your internet connection and try again.';
    }
    
    console.error('Error details:', {
      message: errorMessage,
      status: statusCode
    });
    
    // Return appropriate status code and error message
    return res.status(statusCode).json({ 
      error: errorMessage
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

