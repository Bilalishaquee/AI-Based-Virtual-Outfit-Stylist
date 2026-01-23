import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { OutfitHistory, OutfitRecommendation } from '../types';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5000';

export const getWeather = async (city: string = 'New York'): Promise<any> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/weather`, {
      params: { city },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return { temp: 20, condition: 'clear' };
  }
};

export const getOutfitRecommendations = async (
  userId: string,
  gender: string,
  mood: string,
  favoriteColor: string,
  eventType: string,
  wardrobeItems: any[]
): Promise<OutfitRecommendation[]> => {
  try {
    const weather = await getWeather();
    
    const response = await axios.post(`${ML_SERVICE_URL}/recommend`, {
      gender,
      mood,
      favoriteColor,
      weather: weather.condition,
      temperature: weather.temp, // Pass temperature for season detection
      eventType,
      wardrobeItems,
    });

    return response.data.recommendations || [];
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // Return mock recommendations as fallback
    return generateMockRecommendations(wardrobeItems);
  }
};

export const saveOutfitHistory = async (
  userId: string,
  outfit: OutfitRecommendation,
  eventType?: string,
  weather?: string
): Promise<void> => {
  const historyData: OutfitHistory = {
    id: '',
    userId,
    outfit,
    savedAt: Date.now(),
    eventType,
    weather,
  };

  await addDoc(collection(db, 'outfitHistory'), historyData);
};

export const getOutfitHistory = async (userId: string, limitCount: number = 10): Promise<OutfitHistory[]> => {
  try {
    // Try the indexed query first (requires composite index)
    const q = query(
      collection(db, 'outfitHistory'),
      where('userId', '==', userId),
      orderBy('savedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OutfitHistory[];
  } catch (error: any) {
    // If index is missing, fallback to query without orderBy and sort in memory
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.warn('Firestore index not found, using fallback query. Please create the index using firestore.indexes.json');
      
      // Fallback: query without orderBy, then sort in memory
      const fallbackQuery = query(
        collection(db, 'outfitHistory'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(fallbackQuery);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OutfitHistory[];
      
      // Sort by savedAt descending and limit
      return results
        .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
        .slice(0, limitCount);
    }
    
    // Re-throw other errors
    throw error;
  }
};

const generateMockRecommendations = (wardrobeItems: any[]): OutfitRecommendation[] => {
  const tops = wardrobeItems.filter((item) => item.category === 'top');
  const bottoms = wardrobeItems.filter((item) => item.category === 'bottom');
  const shoes = wardrobeItems.filter((item) => item.category === 'shoes');
  const outerwear = wardrobeItems.filter((item) => item.category === 'outerwear');

  const recommendations: OutfitRecommendation[] = [];
  
  for (let i = 0; i < 3; i++) {
    const top = tops[Math.floor(Math.random() * tops.length)];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const shoe = shoes[Math.floor(Math.random() * shoes.length)];
    const outerwearItem = outerwear[Math.floor(Math.random() * outerwear.length)];

    if (top && bottom && shoe) {
      recommendations.push({
        id: `mock-${i}`,
        top,
        bottom,
        shoes: shoe,
        outerwear: outerwearItem ? [outerwearItem] : [],
        stylistComment: generateStylistComment(),
        score: 0.8 + Math.random() * 0.2,
        timestamp: Date.now(),
      });
    }
  }

  return recommendations;
};

const generateStylistComment = (): string => {
  const comments = [
    "This combination creates a perfect balance of style and comfort!",
    "The color harmony here is exceptional - great choice!",
    "A timeless look that works for any occasion.",
    "This outfit showcases your personal style beautifully!",
    "The textures and colors complement each other perfectly.",
  ];
  return comments[Math.floor(Math.random() * comments.length)];
};

