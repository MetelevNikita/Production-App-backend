// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCruzlC2TmR4g7gQg2cL2LE4wXYkYUe6uQ",
  authDomain: "productionapp-e4128.firebaseapp.com",
  projectId: "productionapp-e4128",
  storageBucket: "productionapp-e4128.appspot.com",
  messagingSenderId: "826100440239",
  appId: "1:826100440239:web:04726cb6d17c89de6b485a"
};

// Initialize Firebase
export const appFirebase = initializeApp(firebaseConfig);