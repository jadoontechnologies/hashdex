// src/screens/Chat/ChatScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Alert,
} from "react-native";
import { db, now } from "../../services/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { AuthContext } from "../../state/AuthContext";

// Components
import Header from "../../components/Header";
import Avatar from "../../components/Avatar";

// Manual icons
import SendIcon from "../../../assets/icons/send.png";
import AttachmentIcon from "../../../assets/icons/attachment.png";
import CameraIcon from "../../../assets/icons/camera.png";
import GalleryIcon from "../../../assets/icons/gallery.png";
import BanIcon from "../../../assets/icons/ban.png";
import TrashIcon from "../../../assets/icons/trash.png";
import MoreIcon from "../../../assets/icons/more-dots.png";

// ✅ Generate consistent chat ID
const generateChatId = (uid1, uid2) =>
  uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

const ChatScreen = ({ route }) => {
  const { user } = useContext(AuthContext);

  const chatUserId = route?.params?.userId || null;
  const username = route?.params?.userName || "Chat";

  if (!chatUserId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#555" }}>
          Select a chat from ChatList
        </Text>
      </View>
    );
  }

  const chatId = generateChatId(user.uid, chatUserId);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [openAttach, setOpenAttach] = useState(false);
  const attachAnim = useState(new Animated.Value(0))[0];

  const toggleAttachMenu = () => {
    Animated.spring(attachAnim, {
      toValue: openAttach ? 0 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setOpenAttach(!openAttach);
  };

  const openCamera = async () => console.log("Camera clicked");
  const pickImage = async () => console.log("Gallery clicked");

  const attachOptions = [
    { name: "camera", icon: CameraIcon, action: openCamera },
    { name: "gallery", icon: GalleryIcon, action: pickImage },
  ];

  const getButtonStyle = (index) => {
    const y = -(index + 1) * 70;
    return {
      transform: [
        {
          translateY: attachAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, y],
          }),
        },
        { scale: attachAnim },
      ],
      opacity: attachAnim,
    };
  };

  // Blocked listener
  useEffect(() => {
    if (!user?.uid || !chatUserId) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "blocked"),
      (snap) => {
        const blockedIds = snap.docs.map((d) => d.id);
        setIsBlocked(blockedIds.includes(chatUserId));
      }
    );
    return unsub;
  }, [user, chatUserId]);

  const blockUser = async () => {
    await setDoc(doc(db, "users", user.uid, "blocked", chatUserId), {
      timestamp: now(),
    });
    setIsBlocked(true);
  };

  const unblockUser = async () => {
    await deleteDoc(doc(db, "users", user.uid, "blocked", chatUserId));
    setIsBlocked(false);
  };

  const clearChat = async () => {
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const snapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      snapshot.forEach((docItem) => batch.delete(docItem.ref));
      await batch.commit();
      Alert.alert("Chat cleared!");
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  // Load messages
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs.reverse());
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!user?.uid || input.trim() === "" || isBlocked) return;
    const text = input.trim();
    const message = { text, senderId: user.uid, timestamp: now() };

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), message);
      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [user.uid, chatUserId],
          lastMessage: text,
          updatedAt: now(),
          unreadBy: [chatUserId],
        },
        { merge: true }
      );
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Mark as read
  useEffect(() => {
    const markAsRead = async () => {
      try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, { unreadBy: [] });
      } catch (err) {
        console.warn("Failed to mark chat as read:", err);
      }
    };
    if (chatId && user?.uid) markAsRead();
  }, [chatId, user]);

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.uid;
    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {item.text && (
          <Text style={[styles.messageText, isMe && { color: "#fff" }]}>
            {item.text}
          </Text>
        )}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header with 3-dot menu */}
      <Header
        title={username}
        rightIconComponent={
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Image
              source={MoreIcon}
              style={{ width: 24, height: 24, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ paddingTop: 10 }}
      />

      {/* Input + attachments */}
      {!isBlocked && (
        <View style={styles.inputContainer}>
          <View style={{ position: "relative" }}>
            {attachOptions.map((item, i) => (
              <Animated.View
                key={item.name}
                style={[styles.attachOption, getButtonStyle(i)]}
              >
                <TouchableOpacity
                  onPress={() => {
                    toggleAttachMenu();
                    item.action();
                  }}
                >
                  <Image
                    source={item.icon}
                    style={{ width: 22, height: 22, resizeMode: "contain" }}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
            <TouchableOpacity style={styles.attachBtn} onPress={toggleAttachMenu}>
              <Image
                source={AttachmentIcon}
                style={{ width: 22, height: 22, resizeMode: "contain" }}
              />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Image
              source={SendIcon}
              style={{ width: 20, height: 20, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Blocked overlay */}
      {isBlocked && (
        <View style={styles.blockOverlay}>
          <TouchableOpacity style={styles.menuItem} onPress={unblockUser}>
            <Image
              source={BanIcon}
              style={{ width: 20, height: 20, marginRight: 10 }}
            />
            <Text style={styles.menuItemText}>Unblock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={clearChat}>
            <Image
              source={TrashIcon}
              style={{ width: 20, height: 20, marginRight: 10 }}
            />
            <Text style={styles.menuItemText}>Clear Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3-dot menu */}
      <Modal
        transparent
        animationType="fade"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={blockUser}>
              <Image
                source={BanIcon}
                style={{ width: 20, height: 20, marginRight: 10, resizeMode: "contain" }}
              />
              <Text style={styles.menuItemText}>Block User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={clearChat}>
              <Image
                source={TrashIcon}
                style={{ width: 20, height: 20, marginRight: 10, resizeMode: "contain" }}
              />
              <Text style={styles.menuItemText}>Clear Chat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  messageBubble: {
    marginVertical: 5,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 12,
    maxWidth: "70%",
  },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#ff6a3d" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#e5e5ea" },
  messageText: { fontSize: 16 },
  messageImage: { width: 150, height: 150, borderRadius: 12, marginTop: 5 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  attachBtn: {
    padding: 6,
    marginRight: 6,
    backgroundColor: "#eee",
    borderRadius: 25,
  },
  attachOption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff6a3d",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 25,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff6a3d",
  },
  blockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuBox: {
    marginTop: 60,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    width: 160,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default ChatScreen;
