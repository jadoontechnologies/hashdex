// utils/pdfHandler.js
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform, Linking } from "react-native";
import { StorageAccessFramework } from "expo-file-system";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../services/firebase"; // adjust path if needed

// -------------------- Helper --------------------

// Make filenames safe for filesystem
const fixName = (name) =>
  name?.replace(/[^a-zA-Z0-9._-]/g, "_") || `document_${Date.now()}.pdf`;

/**
 * Ensure Cloudinary raw URL ends with .pdf so apps (WhatsApp, FB, etc.) can detect type.
 */
export const fixCloudinaryPDF = (url) => {
  if (!url) return url;
  if (url.includes("/raw/") && !url.toLowerCase().endsWith(".pdf")) {
    return `${url}.pdf`;
  }
  return url;
};

/**
 * Get the actual PDF URL, whether from Firebase storage or direct URL.
 */
const getPDFUrl = async (item) => {
  if (item?.firebasePath) {
    const pdfRef = ref(storage, item.firebasePath);
    return await getDownloadURL(pdfRef);
  }
  return item.url;
};

/**
 * Downloads a PDF to a safe local URI. On Android, copies to documentDirectory for sharing.
 * Returns the local file URI.
 */
export const downloadPdfPermanently = async (pdfUrl, safeName) => {
  const tempUri = FileSystem.cacheDirectory + safeName;
  const destUri =
    Platform.OS === "android"
      ? FileSystem.documentDirectory + safeName
      : tempUri; // iOS: cache is fine

  const { uri } = await FileSystem.downloadAsync(pdfUrl, tempUri);

  if (Platform.OS === "android") {
    try {
      const info = await FileSystem.getInfoAsync(destUri);
      if (info.exists) await FileSystem.deleteAsync(destUri);
    } catch (e) {
      // ignore
    }
    await FileSystem.copyAsync({ from: uri, to: destUri });
  }

  return destUri;
};

// -------------------- Public Functions --------------------

/**
 * Opens or shares the PDF with other apps.
 * Ensures .pdf extension and handles Android/iOS differences safely.
 */
export const openOrSharePDF = async (item) => {
  try {
    let pdfUrl = await getPDFUrl(item);
    pdfUrl = fixCloudinaryPDF(pdfUrl);
    const safe = fixName(item?.name);

    const fileUri = await downloadPdfPermanently(pdfUrl, safe);

    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Open PDF with...",
      UTI: "com.adobe.pdf",
    });
  } catch (err) {
    console.error("PDF Open/Share error:", err);
    Alert.alert("Error", "Unable to open the PDF.");
  }
};

/**
 * Saves PDF to user-selected folder on Android (SAF) or shares/saves on iOS.
 * Uses Base64 for Android SAF to avoid 0KB/corruption issues.
 */
export const savePDF = async (item) => {
  try {
    let pdfUrl = await getPDFUrl(item);
    pdfUrl = fixCloudinaryPDF(pdfUrl);
    const safe = fixName(item?.name);

    const tempUri = FileSystem.cacheDirectory + safe;
    const { uri } = await FileSystem.downloadAsync(pdfUrl, tempUri);
    if (!uri) throw new Error("Download failed");

    if (Platform.OS === "android") {
      const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please grant folder access to save the file.");
        return;
      }

      const newUri = await StorageAccessFramework.createFileAsync(
        perm.directoryUri,
        safe,
        "application/pdf"
      );

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.writeAsStringAsync(newUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert("Saved", `"${safe}" saved successfully!`, [
        { text: "Open", onPress: () => Linking.openURL(newUri) },
        { text: "OK" },
      ]);
    } else {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      });
    }
  } catch (err) {
    console.error("Save PDF error:", err);
    Alert.alert("Error", "Unable to save PDF.");
  }
};
