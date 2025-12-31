import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types';

export const signUp = async (
  email: string,
  password: string,
  profileData: Partial<UserProfile>
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile in Firestore
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    gender: profileData.gender || 'other',
    mood: profileData.mood || 'casual',
    favoriteColor: profileData.favoriteColor || '#000000',
    skinTone: profileData.skinTone || 'Medium',
    hairStyle: profileData.hairStyle || 'short',
    avatarSelections: {
      skinTone: profileData.skinTone || 'Medium',
      hairStyle: profileData.hairStyle || 'short',
    },
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  return user;
};

export const login = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  await setDoc(doc(db, 'users', uid), updates, { merge: true });
};

