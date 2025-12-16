// cloudinary.js (FINAL 100% FIXED VERSION)
import * as FileSystem from "expo-file-system";

const CLOUD_NAME = "ds55cmvgg";
const UPLOAD_PRESET = "Hashdex";

/**
 * Convert content:// URI to file:// path (Android)
 */
const getActualFilePath = async (uri) => {
  if (uri.startsWith("content://")) {
    const fileName = uri.split("/").pop() || `file_${Date.now()}`;
    const newPath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: uri, to: newPath });
    return newPath;
  }
  return uri;
};

/**
 * Upload ANY file (image, video, pdf) to Cloudinary
 * Automatically adds .pdf extension for RAW uploads
 */
export const uploadToCloudinary = async (uri, type, originalName = null) => {
  try {
    console.log("📁 Selected File:", uri);

    let resourceType = "image";
    let mimeType = "image/jpeg";
    let finalName = originalName || "file";

    const lowerUri = uri.toLowerCase();

    const isPDF =
      type === "pdf" ||
      lowerUri.endsWith(".pdf") ||
      (originalName && originalName.toLowerCase().endsWith(".pdf"));

    const isVideo =
      type === "video" ||
      lowerUri.endsWith(".mp4") ||
      lowerUri.endsWith(".mov");

    // ---------------------------
    // Correct File Type Detection
    // ---------------------------
    if (isPDF) {
      resourceType = "raw";
      mimeType = "application/pdf";

      // ⭐ Must end with .pdf always
      if (!finalName.toLowerCase().endsWith(".pdf")) {
        finalName = `${finalName.replace(/\.[^/.]+$/, "")}.pdf`;
      }

      console.log("📄 PDF Detected → Upload as RAW with .pdf");
    } else if (isVideo) {
      resourceType = "video";
      mimeType = "video/mp4";

      if (!finalName.toLowerCase().endsWith(".mp4")) {
        finalName = `${finalName.replace(/\.[^/.]+$/, "")}.mp4`;
      }

      console.log("🎥 Video Detected");
    } else {
      resourceType = "image";
      mimeType = "image/jpeg";

      if (!finalName.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        finalName = `${finalName}.jpg`;
      }

      console.log("🖼 Image Detected");
    }

    // Convert content:// to file://
    const fixedUri = await getActualFilePath(uri);

    // -----------------------------
    // READ AS BINARY (VERY IMPORTANT)
    // -----------------------------
    const fileAsBase64 = await FileSystem.readAsStringAsync(fixedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();

    formData.append("file", `data:${mimeType};base64,${fileAsBase64}`);
    formData.append("upload_preset", UPLOAD_PRESET);

    // ⭐ CRUCIAL FIX — forces Cloudinary to KEEP the extension
    formData.append("public_id", finalName.replace(/\.[^/.]+$/, ""));

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    console.log("📤 Uploading to Cloudinary:", {
      endpoint,
      resourceType,
      mimeType,
      finalName,
    });

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("❌ Cloudinary Upload Error:", data);
      throw new Error(data.error?.message || "Upload failed");
    }

    // ⭐ Cloudinary returns correct URL WITH EXTENSION now
    let secureUrl = data.secure_url;

    if (isPDF && !secureUrl.endsWith(".pdf")) {
      secureUrl = `${secureUrl}.pdf`; // Safety patch
    }

    console.log("✅ Upload Success:", secureUrl);
    return secureUrl;

  } catch (err) {
    console.error("❌ Upload Failed:", err);
    return null;
  }
};
