import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'bid_submitted' | 'status_changed' | 'message_received',
  relatedId: string
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      relatedId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // We don't necessarily want to block the main action if notification fails, 
    // but in a production app you'd handle this more robustly.
  }
}
