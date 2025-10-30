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
} from "firebase/firestore";
import { AuthContext } from "../../state/AuthContext";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

const generateChatId = (uid1, uid2) =>
  uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

// 🔹 Header
const Header = ({ title, photoURL, navigation, onMenuPress, showMenu }) => (
  <LinearGradient
    colors={["#F9F871", "#F28A47", "#DE5C76"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.header}
  >
    <View style={styles.headerLeft}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.headerBtn}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      {photoURL && (
        <LinearGradient
          colors={["#F9F871", "#F28A47", "#DE5C76"]}
          style={styles.headerAvatarBorder}
        >
          <Image source={{ uri: photoURL }} style={styles.headerAvatar} />
        </LinearGradient>
      )}
      {title && <Text style={styles.headerTitle}>{title}</Text>}
    </View>

    <View style={styles.headerRight}>
      {showMenu && (
        <TouchableOpacity onPress={onMenuPress} style={styles.headerBtn}>
          <Entypo name="dots-three-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  </LinearGradient>
);

const ChatScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);

  // ✅ Correct parameter names
  const chatUserId = route.params?.userId;
  const username = route.params?.userName;
  const photoURL = route.params?.photoURL;

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

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) console.log("📷 Picked:", result.assets[0].uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) console.log("🖼 Picked:", result.assets[0].uri);
  };

  const attachOptions = [
    { name: "camera", icon: "camera", action: openCamera },
    { name: "gallery", icon: "image", action: pickImage },
  ];

  const buttonSpacing = 70;
  const getButtonStyle = (index) => {
    const y = -(index + 1) * buttonSpacing;
    return {
      transform: [
        { translateY: attachAnim.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
        { scale: attachAnim },
      ],
      opacity: attachAnim,
    };
  };

  // 🔹 Blocked status
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
    if (!user?.uid || !chatUserId) return;
    await setDoc(doc(db, "users", user.uid, "blocked", chatUserId), {
      timestamp: now(),
    });
    setIsBlocked(true);
  };

  const unblockUser = async () => {
    if (!user?.uid || !chatUserId) return;
    await deleteDoc(doc(db, "users", user.uid, "blocked", chatUserId));
    setIsBlocked(false);
  };

  const clearChat = async () => {
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const snap = await onSnapshot(messagesRef, async () => { }); // ensure reference exists

      const snapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      snapshot.forEach((docItem) => batch.delete(docItem.ref));
      await batch.commit();

      alert("Chat cleared!");
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  // 🔹 Load messages
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs.reverse());
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!user?.uid || input.trim() === "" || isBlocked) return;
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: input,
        senderId: user.uid,
        timestamp: now(),
      });
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
        {item.text && (
          <Text style={[styles.messageText, isMe ? { color: "#fff" } : { color: "#000" }]}>
            {item.text}
          </Text>
        )}
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Header
        title={username || "Chat"}
        photoURL={photoURL}
        navigation={navigation}
        showMenu
        onMenuPress={() => setMenuVisible(true)}
      />

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ paddingTop: 10 }}
      />

      {!isBlocked && (
        <View style={styles.inputContainer}>
          <View style={{ position: "relative" }}>
            {attachOptions.map((item, i) => (
              <Animated.View key={item.name} style={[styles.attachOption, getButtonStyle(i)]}>
                <TouchableOpacity
                  onPress={() => {
                    toggleAttachMenu();
                    item.action();
                  }}
                >
                  <Ionicons name={item.icon} size={22} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            ))}
            <TouchableOpacity style={styles.attachBtn} onPress={toggleAttachMenu}>
              <Entypo name="attachment" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {isBlocked && (
        <View style={styles.blockOverlay}>
          <TouchableOpacity
            style={styles.blockBackBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.blockText}>Unblock to chat</Text>
          <TouchableOpacity style={styles.blockBtn} onPress={unblockUser}>
            <Text style={{ color: "#fff" }}>Unblock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.blockBtn, { backgroundColor: "#888" }]} onPress={clearChat}>
            <Text style={{ color: "#fff" }}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        transparent
        animationType="fade"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={blockUser}>
              <Ionicons name="ban" size={18} color="#DE5C76" />
              <Text style={styles.menuText}>Block User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                clearChat();
              }}
            >
              <Ionicons name="trash" size={18} color="#DE5C76" />
              <Text style={styles.menuText}>Clear Chat</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerBtn: { padding: 6 },
  headerAvatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#eee" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  headerRight: { minWidth: 40, alignItems: "flex-end" },
  messageBubble: { marginVertical: 5, marginHorizontal: 10, padding: 10, borderRadius: 12, maxWidth: "70%" },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#ff6a3d" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#e5e5ea" },
  messageText: { fontSize: 16 },
  messageImage: { width: 150, height: 150, borderRadius: 12, marginTop: 5 },
  inputContainer: { flexDirection: "row", padding: 10, backgroundColor: "#fff", alignItems: "center" },
  attachBtn: { padding: 6, marginRight: 6, backgroundColor: "#eee", borderRadius: 25 },
  attachOption: { position: "absolute", bottom: 0, left: 0, width: 50, height: 50, borderRadius: 25, backgroundColor: "#ff6a3d", justifyContent: "center", alignItems: "center", elevation: 5 },
  input: { flex: 1, padding: 12, borderRadius: 25, backgroundColor: "#f0f0f0", marginRight: 10, fontSize: 16 },
  sendButton: { borderRadius: 25, padding: 12, justifyContent: "center", alignItems: "center", backgroundColor: "#ff6a3d" },
  blockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center", zIndex: 10 },
  blockText: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  blockBtn: { backgroundColor: "#ff6a3d", padding: 12, borderRadius: 25, width: 140, marginTop: 10, alignItems: "center" },
  blockBackBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 6,
    zIndex: 20,
  },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-start", alignItems: "flex-end" },
  menuBox: { marginTop: 60, marginRight: 10, backgroundColor: "#fff", borderRadius: 8, paddingVertical: 8, width: 160, elevation: 5 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12 },
  menuText: { fontSize: 15, marginLeft: 8, color: "#333" },
});

export default ChatScreen;
