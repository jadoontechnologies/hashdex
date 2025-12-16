// src/hooks/useShareHandler.js
import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import ShareMenu from "react-native-share-menu";

/**
 * Global hook to handle Android/iOS share intents.
 * Detects text, image, or video shares and routes to ReceiveShare screen.
 */
export default function useShareHandler() {
  const navigation = useNavigation();
  const navigationRef = useRef(null);
  const pendingShareRef = useRef(null); // stores share if nav not ready yet

  // ✅ Keep latest navigation reference
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  useEffect(() => {
    // --- Helper to handle incoming share data
    const handleShare = (item) => {
      if (!item) return;
      console.log("📩 Shared item received:", item);

      const { mimeType, data } = item;
      const params = {};

      if (mimeType?.includes("text")) {
        params.sharedText = data;
      } else if (mimeType?.includes("image")) {
        params.sharedImage = Array.isArray(data) ? data[0] : data;
      } else if (mimeType?.includes("video")) {
        params.sharedVideo = Array.isArray(data) ? data[0] : data;
      }

      // --- Safe navigation or defer until ready
      if (navigationRef.current?.navigate) {
        navigationRef.current.navigate("ReceiveShare", { sharedItem: params });
      } else {
        console.warn("⚠️ Navigation not ready yet. Storing pending share.");
        pendingShareRef.current = params;
      }
    };

    // --- Handle share if app was launched via share intent
    ShareMenu.getInitialShare(handleShare);

    // --- Listen for new shares while app is running
    const listener = ShareMenu.addNewShareListener(handleShare);

    // --- Cleanup listener
    return () => {
      if (listener?.remove) listener.remove();
      else ShareMenu.clearListeners?.();
    };
  }, []);

  // ✅ Process any pending share once navigation becomes ready
  useEffect(() => {
    if (pendingShareRef.current && navigationRef.current?.navigate) {
      navigationRef.current.navigate("ReceiveShare", {
        sharedItem: pendingShareRef.current,
      });
      pendingShareRef.current = null;
    }
  }, [navigation]);
}
