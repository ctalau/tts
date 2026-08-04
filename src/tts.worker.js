import { KokoroTTS } from "kokoro-js";

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
    self.postMessage({ type: "status", message: "Creating your audio…" });
    const audio = await tts.generate(data.text, { voice: data.voice, speed: data.speed });
    self.postMessage({ type: "result", blob: audio.toBlob() });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Speech generation failed.",
    });
  }
};
