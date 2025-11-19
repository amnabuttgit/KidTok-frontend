// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <-- 1. Import getAuth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFPLlXEae264hoZQaRPLBDX77VQG0uj7k",
  authDomain: "amnanew-38d62.firebaseapp.com",
  projectId: "amnanew-38d62",
  storageBucket: "amnanew-38d62.firebasestorage.app",
  messagingSenderId: "724113436842",
  appId: "1:724113436842:web:8db688365ca3349a2160d3",
  measurementId: "G-GJJS33P2BH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app); // <-- 2. Initialize auth using getAuth()

export { app, auth }; // <-- 3. Export both app and auth