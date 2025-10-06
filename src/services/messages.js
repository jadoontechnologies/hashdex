// services/message.js
import { db, now } from "./firebase";
import { collection, addDoc, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";

/**
 * Fetch messages once (one-time fetch)
 */
export const fetchMessages = async (chatId) => {
  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

/**
 * Real-time listener for messages
 */
export const subscribeMessages = (chatId, callback) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });

  return unsubscribe;
};

/**
 * Send a message using current user from AuthContext
 * @param {string} chatId
 * @param {object} user - logged-in user from AuthContext
 * @param {string} text
 * @param {string} imageUrl
 */
export const sendMessage = async (chatId, user, text, imageUrl = null) => {
  if (!user || !user.id) {
    console.error("Cannot send message: no logged-in user provided");
    return;
  }

  try {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: text || null,
      imageUrl: imageUrl || null,
      senderId: user.id,
      timestamp: now(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
