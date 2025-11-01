// src/services/notification.js
import * as Notifications from "expo-notifications";
import { db, now } from "./firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { Alert, AppState } from "react-native";

/**
 * ✅ Notification service using Expo Notifications
 * Works with Expo push tokens (no native Firebase SDK required)
 */
export class NotificationService {
  // Register device for push notifications
  static async registerForPushNotificationsAsync(userId) {
    if (!userId) return null;

    try {
      // Ask permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("🚫 Notification permission not granted");
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications in settings to receive alerts."
        );
        return null;
      }

      // ✅ Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = tokenData.data;
      console.log("✅ Expo Push Token:", expoPushToken);

      // Save token to Firestore
      await updateDoc(doc(db, "users", userId), {
        expoPushToken,
        tokenUpdatedAt: now(),
      });

      return expoPushToken;
    } catch (err) {
      console.error("❌ Error registering push token:", err);
      return null;
    }
  }

  // Setup notification listeners
  static setupNotificationListeners(navigation) {
    // Foreground listener
    const foregroundListener =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📩 Notification received (foreground):", notification);
        const { data } = notification.request.content;
        if (AppState.currentState === "active") {
          Alert.alert(
            notification.request.content.title || "New Notification",
            notification.request.content.body || "You have a new update.",
            [
              {
                text: "View",
                onPress: () =>
                  this.handleNotificationNavigation(data, navigation),
              },
              { text: "Dismiss", style: "cancel" },
            ]
          );
        }
      });

    // Background listener (when tapped)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("🟡 App opened from notification:", response);
        const data = response.notification.request.content.data;
        this.handleNotificationNavigation(data, navigation);
      });

    console.log("✅ Expo notification listeners registered");

    return { foregroundListener, responseListener };
  }

  // Handle navigation from notification
  static handleNotificationNavigation(data, navigation) {
    if (!data || !navigation) return;
    const rootNav = navigation.getParent?.() || navigation;

    switch (data.type) {
      case "message":
        if (data.fromUserId) {
          rootNav.navigate("Main", {
            screen: "Chat",
            params: {
              userId: data.fromUserId,
              userName: data.fromUserName || "User",
            },
          });
        }
        break;

      case "follow":
        rootNav.navigate("Main", {
          screen: "ProfileTab",
          params: { screen: "Friends" },
        });
        break;

      case "like":
      case "comment":
        if (data.postId) {
          rootNav.navigate("Main", {
            screen: "Feed",
            params: { postId: data.postId },
          });
        }
        break;

      default:
        console.log("⚠️ Unhandled notification type:", data?.type);
    }
  }
}

/**
 * ✅ Send push notification via Expo Push API
 * Requires that user.expoPushToken is saved in Firestore
 */
export async function sendNotification(toUid, payload) {
  if (!toUid || !payload?.message) return;

  const notification = {
    ...payload,
    read: false,
    createdAt: now(),
  };

  try {
    // Save in Firestore (optional)
    await addDoc(collection(db, "users", toUid, "notifications"), notification);

    // Get recipient’s Expo token
    const userSnap = await getDoc(doc(db, "users", toUid));
    const userData = userSnap.data();
    const expoPushToken = userData?.expoPushToken;

    if (!expoPushToken) {
      console.warn(`⚠️ No Expo token found for user ${toUid}`);
      return;
    }

    // Send push via Expo’s API
    const message = {
      to: expoPushToken,
      sound: "default",
      title: payload.title || "HashDex",
      body: payload.message,
      data: payload,
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    console.log("✅ Notification sent via Expo:", payload);
  } catch (err) {
    console.error("❌ sendNotification error:", err);
  }
}
