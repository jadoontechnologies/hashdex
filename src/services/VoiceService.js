// services/VoiceService.js
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import { Buffer } from "buffer";

const ASSEMBLY_API_KEY = "abc"; // <-- replace with your AssemblyAI API key
const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";

let _recording = null;

/**
 * Ensure microphone permission is granted
 */
async function ensurePermission() {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Permission",
        message: "This app needs access to your microphone to record audio.",
        buttonPositive: "OK",
        buttonNegative: "Cancel",
      }
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error("Microphone permission denied");
    }
  } else {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") throw new Error("Microphone permission denied");
  }
}

/**
 * Start recording audio
 */
export async function startRecording() {
  try {
    // Stop any existing recording
    if (_recording) {
      try {
        await _recording.stopAndUnloadAsync();
      } catch (e) {}
      _recording = null;
    }

    await ensurePermission();

    // Audio mode setup for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });

    _recording = new Audio.Recording();
    await _recording.prepareToRecordAsync(
      Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
    );
    await _recording.startAsync();
  } catch (err) {
    if (_recording) {
      try {
        await _recording.stopAndUnloadAsync();
      } catch (e) {}
      _recording = null;
    }
    throw err;
  }
}

/**
 * Stop recording and transcribe audio using AssemblyAI
 */
export async function stopRecordingAndTranscribe({ language = "en" } = {}) {
  try {
    if (!_recording) throw new Error("No active recording");

    await _recording.stopAndUnloadAsync();
    const uri = _recording.getURI();
    _recording = null;

    if (!uri) throw new Error("Could not get recording URI");

    // Read file as Base64
    const fileBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert Base64 to Uint8Array
    const arrayBuffer = Buffer.from(fileBase64, "base64");

    // Upload audio to AssemblyAI
    const uploadRes = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: {
        authorization: ASSEMBLY_API_KEY,
        "content-type": "application/octet-stream",
      },
      body: arrayBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error("Upload failed: " + errText);
    }

    const uploadData = await uploadRes.json();
    const audio_url = uploadData.upload_url || uploadData.url;
    if (!audio_url) throw new Error("No upload URL returned");

    // Request transcription
    const createRes = await fetch(TRANSCRIPT_URL, {
      method: "POST",
      headers: {
        authorization: ASSEMBLY_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({ audio_url, language_code: language }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error("Failed to request transcription: " + errText);
    }

    const createData = await createRes.json();
    const transcriptId = createData.id;
    if (!transcriptId) throw new Error("No transcript ID returned");

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // ~30s timeout
    while (true) {
      attempts++;
      const pollRes = await fetch(`${TRANSCRIPT_URL}/${transcriptId}`, {
        headers: { authorization: ASSEMBLY_API_KEY },
      });
      if (!pollRes.ok) {
        const errText = await pollRes.text();
        throw new Error("Transcript polling failed: " + errText);
      }

      const pollData = await pollRes.json();

      if (pollData.status === "completed") {
        return { text: pollData.text || "" };
      }
      if (pollData.status === "error") {
        throw new Error(
          "Transcription error: " + (pollData.error || "unknown")
        );
      }

      if (attempts >= maxAttempts) {
        throw new Error("Transcription timed out");
      }

      const waitMs = attempts < 5 ? 800 : 1500;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  } catch (err) {
    if (_recording) {
      try {
        await _recording.stopAndUnloadAsync();
      } catch (e) {}
      _recording = null;
    }
    throw err;
  }
}
