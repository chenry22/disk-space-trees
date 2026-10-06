import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { 
    getFirestore,
    collection, 
    addDoc, getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBo8OOStO4G3nYyVQDRsfVwTO_8_fpZcEQ",
    authDomain: "disk-space-trees.firebaseapp.com",
    projectId: "disk-space-trees",
    storageBucket: "disk-space-trees.firebasestorage.app",
    messagingSenderId: "856557623389",
    appId: "1:856557623389:web:b66d31af181cec466695b4",
    measurementId: "G-VHM1W49KSM"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

async function initLoadTrees() {
    const snapshot = await getDocs(collection(db, "trees"));
    snapshot.forEach(doc => {
        if (doc.id === 'template') return; 
        const d = doc.data();
        if (d.x !== undefined && d.y !== undefined && d.hash !== undefined) {
            trees[d.x + ',' + d.y] = {
                hash: d.hash, name: d.name ?? '', title: d.title ?? '', 
                description: d.description ?? ''
            }
        }
    });
}

export async function addTree(payload) {
    if (payload.x === undefined || payload.y === undefined || payload.hash === undefined) return false;
    try {
        const docRef = await addDoc(collection(db, "trees"), payload);
        console.log("Document written with ID: ", docRef.id);
        return true;
    } catch (e) {
        console.error("Error loading documents: ", e);
        return false
    }
}

initLoadTrees();