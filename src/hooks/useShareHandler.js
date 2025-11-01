// src/hooks/useShareHandler.js
import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import ShareMenu from "react-native-share-menu";

/**
 * Handles incoming shares globally (text, links, images)
 * and navigates to ReceiveShare or Compose screen.
 */
export default function useShareHandler() {
  const navigation = useNavigation();
  const navigationRef = useRef();

  // Keep navigation ref updated
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  useEffect(() => {
    // 🔹 Function to process incoming shared content
    const handleShare = (item) => {
      if (!item) return;

      console.log("📩 Shared item received:", item);

      const { mimeType, data } = item;
      let params = {};

      if (mimeType?.includes("text")) {
        params.sharedText = data;
      } else if (mimeType?.includes("image")) {
        params.sharedImage = Array.isArray(data) ? data[0] : data;
      } else if (mimeType?.includes("video")) {
        params.sharedVideo = Array.isArray(data) ? data[0] : data;
      }

      // Use navigation ref with safety check
      if (navigationRef.current) {
        navigationRef.current.navigate("ReceiveShare", { sharedItem: params });
      } else {
        console.warn("Navigation not available yet, storing share data for later");
        // You could store this in context/async storage and handle when nav is ready
      }
    };

    // 🔹 Get data if app launched from a shared intent
    ShareMenu.getInitialShare(handleShare);

    // 🔹 Listen for new shares while app is open
    const listener = ShareMenu.addNewShareListener(handleShare);

    // 🔹 Cleanup listener when component unmounts
    return () => {
      if (listener?.remove) listener.remove();
      else ShareMenu.clearListeners?.();
    };
  }, []); // Remove navigation from dependencies
}