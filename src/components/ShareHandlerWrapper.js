// src/components/ShareHandlerWrapper.js
import React, { useEffect } from "react";
import ShareMenu from "react-native-share-menu";
import { navigationRef } from "../../App"; // ✅ import global ref from App.js

export default function ShareHandlerWrapper({ children }) {
  useEffect(() => {
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

      // ✅ Navigate directly if navigation is ready
      if (navigationRef.current) {
        navigationRef.current.navigate("ReceiveShare", { sharedItem: params });
      } else {
        console.warn("⚠️ Navigation not ready yet for share intent.");
      }
    };

    // Handle initial and live share events
    ShareMenu.getInitialShare(handleShare);
    const listener = ShareMenu.addNewShareListener(handleShare);

    return () => {
      if (listener?.remove) listener.remove();
      else ShareMenu.clearListeners?.();
    };
  }, []);

  return children;
}
