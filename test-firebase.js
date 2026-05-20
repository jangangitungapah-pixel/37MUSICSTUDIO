import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./src/firebase.js";

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
