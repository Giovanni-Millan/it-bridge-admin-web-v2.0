
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyB5ti7P0ckTuhRWO3Occdtb2pwgM0UKswM",
  authDomain: "bridge-6d78b.firebaseapp.com",
  projectId: "bridge-6d78b",
  storageBucket: "bridge-6d78b.firebasestorage.app",
  messagingSenderId: "573550747257",
  appId: "1:573550747257:web:9c3653e025e242d90abea8",
  measurementId: "G-4Q4S954YJE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth=getAuth(app);

export default app;