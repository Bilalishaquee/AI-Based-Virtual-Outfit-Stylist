export interface UserProfile {
  uid: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  mood: string;
  favoriteColor: string;
  skinTone: 'Fair' | 'Medium' | 'Dark';
  hairStyle: string;
  avatarSelections: {
    skinTone: string;
    hairStyle: string;
  };
}

export interface WardrobeItem {
  id: string;
  userId: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessories';
  gender: 'male' | 'female' | 'unisex';
  dominantColor: string;
  uploadTimestamp: number;
  imageUrl: string;
  storagePath: string;
}

export interface OutfitRecommendation {
  id: string;
  top?: WardrobeItem;
  bottom?: WardrobeItem;
  shoes?: WardrobeItem;
  accessories?: WardrobeItem[];
  stylistComment: string;
  score: number;
  timestamp: number;
}

export interface OutfitHistory {
  id: string;
  userId: string;
  outfit: OutfitRecommendation;
  savedAt: number;
  eventType?: string;
  weather?: string;
}

