// auth-guard.js

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

// Check if the user is signed in
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        console.log("User is not signed in, redirecting to login page");
        // User is not signed in, redirect to login page
        window.location.href = 'https://afnanaicom-rgb.github.io/a/login.html';
    } else {
        console.log("User is signed in:", user.email);
        
        try {
            // Check if user data exists in Firebase Database
            const userRef = ref(db, 'users/' + user.uid);
            const snapshot = await get(userRef);
            
            if (!snapshot.exists()) {
                // User data doesn't exist, redirect to onboarding
                console.log("User data not found, redirecting to onboarding");
                window.location.href = 'https://afnanaicom-rgb.github.io/a/id.html';
            } else {
                console.log("User data found, allowing access to main page");
                // User data exists, allow access to the page
            }
        } catch (error) {
            console.error("Error checking user data:", error);
            // On error, redirect to onboarding to be safe
            window.location.href = 'https://afnanaicom-rgb.github.io/a/id.html';
        }
    }
});
