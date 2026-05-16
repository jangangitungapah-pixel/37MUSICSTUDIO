import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4qKie7jK8y0Ecy3_uKgdpgHRxKe9yhYo",
  authDomain: "music-studio-f69d8.firebaseapp.com",
  projectId: "music-studio-f69d8",
  storageBucket: "music-studio-f69d8.firebasestorage.app",
  messagingSenderId: "209614719546",
  appId: "1:209614719546:web:4f59461a46e75685b28303",
  measurementId: "G-9MYM65WQ9E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  try {
    console.log("Testing read...");
    const ref = doc(db, "config", "test_doc");
    await getDoc(ref);
    console.log("Read successful!");
    
    console.log("Testing write...");
    await setDoc(ref, { test: "data" });
    console.log("Write successful!");
    process.exit(0);
  } catch (error) {
    console.error("Firebase Error:", error.message);
    process.exit(1);
  }
}

testFirebase();
