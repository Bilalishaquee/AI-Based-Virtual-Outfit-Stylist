import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImageToImgBB } from './imageStorageService';
import { WardrobeItem } from '../types';

export const uploadWardrobeItem = async (
  file: File,
  userId: string,
  category: WardrobeItem['category'],
  gender: WardrobeItem['gender'],
  dominantColor: string
): Promise<WardrobeItem> => {
  // Upload image to ImgBB
  const timestamp = Date.now();
  const { url: imageUrl } = await uploadImageToImgBB(file, userId);

  // Save metadata to Firestore
  const itemData: Omit<WardrobeItem, 'id'> = {
    userId,
    category,
    gender,
    dominantColor,
    uploadTimestamp: timestamp,
    imageUrl,
    storagePath: imageUrl, // Store ImgBB URL as storagePath for reference
  };

  const docRef = await addDoc(collection(db, 'wardrobe'), itemData);
  
  return {
    id: docRef.id,
    ...itemData,
  };
};

export const getUserWardrobe = async (userId: string): Promise<WardrobeItem[]> => {
  const q = query(collection(db, 'wardrobe'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as WardrobeItem[];
};

export const deleteWardrobeItem = async (itemId: string): Promise<void> => {
  // Note: ImgBB free tier doesn't support programmatic deletion
  // We only delete the reference from Firestore
  // The image will remain on ImgBB servers
  await deleteDoc(doc(db, 'wardrobe', itemId));
};

