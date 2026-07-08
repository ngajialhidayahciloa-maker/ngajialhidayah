import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { Santri, Report, Attendance } from './types';

// Loaded from the provisioned firebase applet config
const firebaseConfig = {
  apiKey: "AIzaSyBJLQ0-YEf52zfqOCLQ-AqTrdPcxAbM-dA",
  authDomain: "gen-lang-client-0292722746.firebaseapp.com",
  projectId: "gen-lang-client-0292722746",
  storageBucket: "gen-lang-client-0292722746.firebasestorage.app",
  messagingSenderId: "410289759539",
  appId: "1:410289759539:web:46ec347ed378cdcd37ca46"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {}, "ai-studio-bukupenghubungdi-c52a281b-592f-4a25-af1a-7e55a6f5de95");

// Helper functions for Database interactions
export async function getSantriFromFirestore(): Promise<Santri[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'santri'));
    const list: Santri[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Santri);
    });
    return list;
  } catch (error) {
    console.error("Error loading santri from Firestore:", error);
    throw error;
  }
}

export async function getReportsFromFirestore(): Promise<Report[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'reports'));
    const list: Report[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Report);
    });
    return list;
  } catch (error) {
    console.error("Error loading reports from Firestore:", error);
    throw error;
  }
}

export async function getAttendanceFromFirestore(): Promise<Attendance[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'attendance'));
    const list: Attendance[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Attendance);
    });
    return list;
  } catch (error) {
    console.error("Error loading attendance from Firestore:", error);
    throw error;
  }
}

export async function saveSantriToFirestore(santri: Santri): Promise<void> {
  try {
    await setDoc(doc(db, 'santri', santri.id), santri);
  } catch (error) {
    console.error("Error saving santri to Firestore:", error);
  }
}

export async function deleteSantriFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'santri', id));
  } catch (error) {
    console.error("Error deleting santri from Firestore:", error);
  }
}

export async function saveReportToFirestore(report: Report): Promise<void> {
  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (error) {
    console.error("Error saving report to Firestore:", error);
  }
}

export async function saveAttendanceListToFirestore(attendanceList: Attendance[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    attendanceList.forEach((item) => {
      const docRef = doc(db, 'attendance', item.id);
      batch.set(docRef, item);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving attendance batch to Firestore:", error);
  }
}

export async function seedInitialData(
  initialSantri: Santri[], 
  initialReports: Report[], 
  initialAttendance: Attendance[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    initialSantri.forEach((item) => {
      batch.set(doc(db, 'santri', item.id), item);
    });
    
    initialReports.forEach((item) => {
      batch.set(doc(db, 'reports', item.id), item);
    });
    
    initialAttendance.forEach((item) => {
      batch.set(doc(db, 'attendance', item.id), item);
    });
    
    await batch.commit();
    console.log("Seeding initial data successfully completed!");
  } catch (error) {
    console.error("Error seeding initial data to Firestore:", error);
  }
}
