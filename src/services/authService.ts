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
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore with defaults
    // Only gender is required at signup, other fields use defaults
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      gender: profileData.gender || 'other',
      mood: 'casual', // Default mood - will be set at outfit selection time
      favoriteColor: '#808080', // Default neutral gray - will be set at outfit selection time
      skinTone: 'Medium', // Default for avatar - can be changed in avatar settings
      hairStyle: 'short', // Default for avatar - can be changed in avatar settings
      avatarSelections: {
        skinTone: 'Medium',
        hairStyle: 'short',
      },
    };

    await setDoc(doc(db, 'users', user.uid), profile);
    return user;
  } catch (error: any) {
    // Provide helpful error messages for common Firebase errors
    if (error.code === 'auth/configuration-not-found') {
      throw new Error(
        'Firebase configuration error. Please check:\n' +
        '1. Your Firebase project exists and credentials match\n' +
        '2. authDomain format is: <project-id>.firebaseapp.com\n' +
        '3. Email/Password authentication is enabled in Firebase Console'
      );
    }
    throw error;
  }
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

