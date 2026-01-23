import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Firebase Storage removed - using ImgBB for image storage instead

// Firebase configuration - trim whitespace from env variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

// Debug: Log loaded values (hide sensitive parts)
if (import.meta.env.DEV) {
  console.log('Firebase Config Loaded:');
  console.log('- API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  console.log('- Auth Domain:', authDomain || 'MISSING');
  console.log('- Project ID:', projectId || 'MISSING');
  console.log('- Storage Bucket:', storageBucket || 'MISSING');
  console.log('- Messaging Sender ID:', messagingSenderId || 'MISSING');
  console.log('- App ID:', appId || 'MISSING');
}

// Validate required environment variables (warn but don't throw)
const hasAllConfig = apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId;

if (!hasAllConfig) {
  console.error('⚠️ Firebase configuration warning: Some environment variables are missing');
  console.error('Required variables:');
  console.error('- VITE_FIREBASE_API_KEY:', apiKey ? '✓' : '✗ MISSING');
  console.error('- VITE_FIREBASE_AUTH_DOMAIN:', authDomain ? '✓' : '✗ MISSING');
  console.error('- VITE_FIREBASE_PROJECT_ID:', projectId ? '✓' : '✗ MISSING');
  console.error('- VITE_FIREBASE_STORAGE_BUCKET:', storageBucket ? '✓' : '✗ MISSING');
  console.error('- VITE_FIREBASE_MESSAGING_SENDER_ID:', messagingSenderId ? '✓' : '✗ MISSING');
  console.error('- VITE_FIREBASE_APP_ID:', appId ? '✓' : '✗ MISSING');
  console.error('\n⚠️ IMPORTANT: If you just created/updated .env file, restart your dev server!');
  console.error('Vite only loads .env files when the server starts.');
}

// Validate authDomain format - it should match projectId
if (!authDomain.includes(projectId) && !authDomain.includes('firebaseapp.com') && !authDomain.includes('web.app')) {
  console.warn('Warning: authDomain should typically be in the format: <project-id>.firebaseapp.com');
  console.warn(`Current authDomain: ${authDomain}`);
  console.warn(`Project ID: ${projectId}`);
}

const firebaseConfig = {
  apiKey: apiKey || '',
  authDomain: authDomain || '',
  projectId: projectId || '',
  storageBucket: storageBucket || '',
  messagingSenderId: messagingSenderId || '',
  appId: appId || ''
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
// Storage removed - using ImgBB instead

export default app;

