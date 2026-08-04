import { KokoroTTS } from "kokoro-js";
import { combineTimedAudio, toWavBlob } from "./timestamps.js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
let modelPromise;

function loadModel() {
  if (!modelPromise) {
    modelPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: "q8",
      device: "wasm",
      progress_callback: (detail) => self.postMessage({ type: "progress", detail }),
    }).catch((error) => {
      modelPromise = undefined;
      throw error;
    });
  }
  return modelPromise;
}

self.onmessage = async ({ data }) => {
  if (data.type !== "generate") return;
  try {
    self.postMessage({ type: "status", message: "Loading Kokoro…" });
    const tts = await loadModel();
    const clips = [];
    for (let index = 0; index < data.segments.length; index += 1) {
      const segment = data.segments[index];
      self.postMessage({ type: "status", message: data.segments.length > 1 ? `Narrating segment ${index + 1} of ${data.segments.length}…` : "Creating your audio…" });
      const audio = await tts.generate(segment.text, { voice: data.voice, speed: data.speed });
      clips.push({ start: segment.start, audio: audio.audio, sampleRate: audio.sampling_rate });
    }
    const sampleRate = clips[0].sampleRate;
    const combined = combineTimedAudio(clips, sampleRate);
    self.postMessage({ type: "result", blob: toWavBlob(combined, sampleRate) });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Speech generation failed.",
    });
  }
};
