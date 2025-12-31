import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { WardrobeItem } from '../types';

export const uploadWardrobeItem = async (
  file: File,
  userId: string,
  category: WardrobeItem['category'],
  gender: WardrobeItem['gender'],
  dominantColor: string
): Promise<WardrobeItem> => {
  // Upload image to Firebase Storage
  const timestamp = Date.now();
  const fileName = `${userId}/${category}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);
  
  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  // Save metadata to Firestore
  const itemData: Omit<WardrobeItem, 'id'> = {
    userId,
    category,
    gender,
    dominantColor,
    uploadTimestamp: timestamp,
    imageUrl,
    storagePath: fileName,
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
  await deleteDoc(doc(db, 'wardrobe', itemId));
};

