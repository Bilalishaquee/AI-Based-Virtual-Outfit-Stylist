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
};

const generateMockRecommendations = (wardrobeItems: any[]): OutfitRecommendation[] => {
  const tops = wardrobeItems.filter((item) => item.category === 'top');
  const bottoms = wardrobeItems.filter((item) => item.category === 'bottom');
  const shoes = wardrobeItems.filter((item) => item.category === 'shoes');
  const accessories = wardrobeItems.filter((item) => item.category === 'accessories');

  const recommendations: OutfitRecommendation[] = [];
  
  for (let i = 0; i < 3; i++) {
    const top = tops[Math.floor(Math.random() * tops.length)];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const shoe = shoes[Math.floor(Math.random() * shoes.length)];
    const accessory = accessories[Math.floor(Math.random() * accessories.length)];

    if (top && bottom && shoe) {
      recommendations.push({
        id: `mock-${i}`,
        top,
        bottom,
        shoes: shoe,
        accessories: accessory ? [accessory] : [],
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

