import { Firestore, doc, getDoc, runTransaction } from 'firebase/firestore';

export async function checkUsernameAvailable(db: Firestore, username: string, currentUid?: string): Promise<boolean> {
  const cleanUsername = username.toLowerCase().trim();
  if (!cleanUsername || cleanUsername.length < 3) return false;

  try {
    const docRef = doc(db, 'usernames', cleanUsername);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return true;
    return currentUid ? snap.data()?.uid === currentUid : false;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

export async function reserveUsername(db: Firestore, username: string, uid: string): Promise<boolean> {
  const cleanUsername = username.toLowerCase().trim();
  if (!cleanUsername || cleanUsername.length < 3) return false;

  try {
    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await transaction.get(usernameRef);

      if (usernameSnap.exists()) {
        const ownerUid = usernameSnap.data()?.uid;
        if (ownerUid && ownerUid !== uid) {
          throw new Error('Username already taken');
        }
      }

      transaction.set(usernameRef, { uid, createdAt: new Date() }, { merge: true });
    });
    return true;
  } catch (error) {
    console.error('Error reserving username:', error);
    return false;
  }
}

export function generateUsernameSuggestions(displayName: string): string[] {
  if (!displayName) return ['player07', 'player_18', 'cric_player'];

  const clean = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = clean || 'player';

  const randomNum1 = Math.floor(Math.random() * 89 + 10);
  const randomNum2 = Math.floor(Math.random() * 899 + 100);

  return [
    `${base}${randomNum1}`,
    `${base}_${randomNum1}`,
    `${base}${randomNum2}`,
  ];
}
