import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIyPivjJU8PUYdOCpRYjoDxjZT1j-WpPs",
  authDomain: "al-guess-game.firebaseapp.com",
  projectId: "al-guess-game",
  storageBucket: "al-guess-game.appspot.com",
  messagingSenderId: "1096384027321",
  appId: "1:1096384027321:web:2f62c7c09b3e51b23a5968",
  measurementId: "G-D22PJ3CVHQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
