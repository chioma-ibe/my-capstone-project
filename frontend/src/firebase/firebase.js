import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDvC0NRKaSYZRLgqjY97E-V_ULAjmWqrt8",
  authDomain: "studdy-buddy-matcher.firebaseapp.com",
  projectId: "studdy-buddy-matcher",
  storageBucket: "studdy-buddy-matcher.firebasestorage.app",
  messagingSenderId: "311990963979",
  appId: "1:311990963979:web:64f86facf79f99fe23dc0e",
  measurementId: "G-6J58F24SM7"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
export default app;
