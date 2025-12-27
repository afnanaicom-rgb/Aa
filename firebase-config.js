// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAYF5Tai9tj5xN2IRt5bQkWrPYvSp_wJg",
  authDomain: "afnanai-640b4.firebaseapp.com",
  databaseURL: "https://afnanai-640b4-default-rtdb.firebaseio.com",
  projectId: "afnanai-640b4",
  storageBucket: "afnanai-640b4.firebasestorage.app",
  messagingSenderId: "940963214513",
  appId: "1:940963214513:web:2c4b3326bd925945215e90",
  measurementId: "G-CS943NS5QR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Set Google Client ID for Google Sign-In
auth.useDeviceLanguage();

const analytics = getAnalytics(app);

export { app, auth, analytics, db };
