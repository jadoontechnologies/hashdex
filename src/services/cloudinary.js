// src/services/cloudinary.js

const CLOUD_NAME = "ds55cmvgg"; 
const API_KEY = "543315566434448"; // example
const API_SECRET = "hqxwT6ggbGViFAe16cad8wUScgI"; // example
const UPLOAD_PRESET = "Hashdex"; // create in Cloudinary dashboard

export const uploadToCloudinary = async (uri, type = "image") => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: type === "video" ? "video/mp4" : "image/jpeg",
      name: `upload.${type === "video" ? "mp4" : "jpg"}`,
    });
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");

    console.log("✅ Cloudinary upload:", data.secure_url);
    return data.secure_url;
  } catch (err) {
    console.error("❌ Cloudinary upload error:", err);
    return null;
  }
};
