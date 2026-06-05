import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { auth } from '../../firebase';
import { mapUserSnapshotToStaff } from '../../entities/staff/staff.mapper';
import { usersRef } from './staffRepository';

export const subscribeToStaff = ({ onData, onEmpty, onError }) => {
  let unsubscribeStaff = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeStaff) {
      unsubscribeStaff();
      unsubscribeStaff = null;
    }

    if (!user || user.isAnonymous) {
      onEmpty();
      return;
    }

    unsubscribeStaff = onSnapshot(usersRef, (snapshot) => {
      onData(mapUserSnapshotToStaff(snapshot));
    }, onError);
  });

  return () => {
    if (unsubscribeStaff) unsubscribeStaff();
    unsubscribeAuth();
  };
};
