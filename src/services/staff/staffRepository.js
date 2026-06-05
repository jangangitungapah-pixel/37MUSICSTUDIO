import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toStaffDocumentUpdate } from '../../entities/staff/staff.utils';

export const usersRef = collection(db, 'users');
export const usernamesRef = collection(db, 'usernames');

export const setStaffProfile = async (uid, profile) => {
  await setDoc(doc(db, 'users', uid), profile);
};

export const setUsernameMapping = async (username, email) => {
  await setDoc(doc(db, 'usernames', username), { email });
};

export const updateStaffDocument = async (id, payload) => {
  await updateDoc(doc(db, 'users', id), toStaffDocumentUpdate(payload));
};

export const deleteStaffDocument = async (id) => {
  await deleteDoc(doc(db, 'users', id));
};

export const updateStaffStatusDocument = async (id, status) => {
  await updateDoc(doc(db, 'users', id), { status });
};
