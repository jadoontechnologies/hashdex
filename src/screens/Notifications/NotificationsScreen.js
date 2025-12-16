// src/screens/Notifications/NotificationsScreen.js
import React, { useEffect, useState, useContext, useRef } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { AuthContext } from "../../state/AuthContext";
import { db } from "../../services/firebase";
import { collection, onSnapshot, orderBy, doc, deleteDoc, updateDoc, query } from "firebase/firestore";
import Header from "../../components/Header";
import { NotificationService } from "../../services/notifications";

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Push notification setup
  useEffect(() => {
    const initNotifications = async () => {
      if (!user?.uid) return;
      const token = await NotificationService.registerForPushNotificationsAsync();
      if (token) await NotificationService.savePushToken(user.uid, token);

      const listeners = await NotificationService.setupNotificationListeners(navigation);
      notificationListener.current = listeners.notificationListener;
      responseListener.current = listeners.responseListener;
    };
    initNotifications();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, navigation]);

  // Firestore real-time notifications
  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      snap => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const handleDelete = async id => {
    try { await deleteDoc(doc(db, "users", user.uid, "notifications", id)); }
    catch (err) { console.error(err); Alert.alert("Error", "Failed to delete notification"); }
  };

  const handleToggleRead = async item => {
    try { await updateDoc(doc(db, "users", user.uid, "notifications", item.id), { read: !item.read }); }
    catch (err) { console.error(err); }
  };

  const handlePress = async item => {
    if (!item.read) await handleToggleRead(item);
    NotificationService.handleNotificationNavigation(item, navigation);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(notifications.map(n => deleteDoc(doc(db, "users", user.uid, "notifications", n.id))));
            } catch { Alert.alert("Error", "Failed to delete all notifications"); }
          }
        }
      ]
    );
  };

  const formatTime = ts => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = (new Date() - date) / (1000 * 60 * 60);
    return diff < 1 ? "Just now" : diff < 24 ? `${Math.floor(diff)}h ago` : date.toLocaleDateString();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.read ? '#f8f9fa' : '#e3f2fd' }]}
      onPress={() => handlePress(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.message, { fontWeight: item.read ? 'normal' : 'bold' }]}>{item.message}</Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleToggleRead(item)} style={styles.iconBtn}>
          <Image
            source={item.read ? require("../../../assets/icons/message.png") : require("../../../assets/icons/mail-open.png")}
            style={styles.iconImage}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
          <Image source={require("../../../assets/icons/trash.png")} style={styles.iconImage} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Notifications" rightIcon="trash" onRightPress={handleDeleteAll} />

      {loading ? (
        <View style={styles.center}>
          <Text>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Image source={require("../../../assets/icons/notifications-off.png")} style={{ width: 64, height: 64, tintColor: "#ccc" }} />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>Notifications about your activity will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  message: { fontSize: 16, color: '#333', marginBottom: 4 },
  time: { fontSize: 12, color: '#666' },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  iconImage: { width: 20, height: 20, resizeMode: "contain" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center' },
});
