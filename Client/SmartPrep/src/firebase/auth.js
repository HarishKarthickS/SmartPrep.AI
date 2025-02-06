import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    OAuthProvider,  // Use OAuthProvider for Yahoo
    GithubAuthProvider 
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyApOvZS0MMfNIZ26_t25fB89S0Xx4ozC4I",
    authDomain: "smartprepai.firebaseapp.com",
    projectId: "smartprepai",
    storageBucket: "smartprepai.firebasestorage.app",
    messagingSenderId: "507094825981",
    appId: "1:507094825981:web:f0e3e3cf9e18764987f794",
    measurementId: "G-XQ6F2THFPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const yahooProvider = new OAuthProvider('yahoo.com'); // Yahoo provider
export const githubProvider = new GithubAuthProvider();
