import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { firebaseConfig } from '../../firebase';
import { createStaffProfile, cleanStaffUsername, getStaffEmail } from '../../entities/staff/staff.utils';
import { deleteStaffDocument, setStaffProfile, setUsernameMapping } from './staffRepository';

const createSecondaryAuthContext = (prefix) => {
  const secondaryApp = initializeApp(firebaseConfig, `${prefix}_${Date.now()}`);
  return {
    secondaryApp,
    secondaryAuth: getAuth(secondaryApp),
  };
};

const cleanupSecondaryApp = async (secondaryApp) => {
  if (secondaryApp) await deleteApp(secondaryApp);
};

export const createStaffAuthAccount = async (staffData, email, password, username) => {
  let secondaryApp;

  try {
    const context = createSecondaryAuthContext('SecondaryApp');
    secondaryApp = context.secondaryApp;
    const cleanUsername = cleanStaffUsername(username);
    const finalEmail = getStaffEmail(email, cleanUsername);
    const userCredential = await createUserWithEmailAndPassword(context.secondaryAuth, finalEmail, password);
    const newUser = userCredential.user;

    const newProfile = createStaffProfile({
      uid: newUser.uid,
      email: finalEmail,
      username: cleanUsername,
      staffData,
      requiresPasswordChange: true,
    });

    try {
      await setStaffProfile(newUser.uid, newProfile);
      await setUsernameMapping(cleanUsername, finalEmail);
    } catch (firestoreError) {
      console.error('Firestore write failed, rolling back Auth user...', firestoreError);
      await newUser.delete().catch((deleteErr) => console.error('Rollback delete failed:', deleteErr));
      throw firestoreError;
    }

    await signOut(context.secondaryAuth);
    await cleanupSecondaryApp(secondaryApp);
    secondaryApp = null;

    return {
      ...staffData,
      id: newUser.uid,
      username: cleanUsername,
      status: 'active',
      permissions: newProfile.permissions,
    };
  } catch (error) {
    if (secondaryApp) {
      try { await cleanupSecondaryApp(secondaryApp); } catch { /* ignore */ }
    }
    throw error;
  }
};

export const resetStaffAuthPassword = async (oldStaff, newPassword) => {
  let secondaryApp;

  try {
    const context = createSecondaryAuthContext('SecondaryAppReset');
    secondaryApp = context.secondaryApp;
    const newEmail = `${oldStaff.username}_${Date.now()}@37musicstudio.local`;
    const userCredential = await createUserWithEmailAndPassword(context.secondaryAuth, newEmail, newPassword);
    const newUser = userCredential.user;

    // TODO: Move administrative password resets to Cloud Functions/Admin SDK.
    const newProfile = createStaffProfile({
      uid: newUser.uid,
      email: newEmail,
      username: oldStaff.username,
      staffData: oldStaff,
      requiresPasswordChange: false,
    });

    try {
      await setStaffProfile(newUser.uid, newProfile);
      await setUsernameMapping(oldStaff.username, newEmail);
    } catch (firestoreError) {
      console.error('Firestore user creation failed during reset, deleting new Auth user...', firestoreError);
      await newUser.delete().catch((deleteErr) => console.error('Rollback delete failed:', deleteErr));
      throw firestoreError;
    }

    await signOut(context.secondaryAuth);
    await cleanupSecondaryApp(secondaryApp);
    secondaryApp = null;

    try {
      await deleteStaffDocument(oldStaff.id);
    } catch (error) {
      console.warn('Could not delete old user doc', error);
    }

    return { ...oldStaff, id: newUser.uid };
  } catch (error) {
    console.error('Error resetting staff password:', error);
    if (secondaryApp) await cleanupSecondaryApp(secondaryApp).catch(console.error);
    throw error;
  }
};
