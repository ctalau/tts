# Kokoro Voice Studio

A static React app that turns text into playable WAV audio entirely inside the browser with [kokoro-js](https://www.npmjs.com/package/kokoro-js). The model and WASM runtime are loaded in a Web Worker, so text never leaves the device and inference does not freeze the interface.

## Development

```bash
npm install
npm run dev
```

The first generation downloads the quantized Kokoro model from Hugging Face. Browser caching makes later visits faster.

To schedule narration, put a timestamp in seconds at the beginning of every non-empty line. The generated WAV preserves silence before each segment (and mixes segments if their scheduled times overlap):

```text
[0] First slide
[7.2] Second slide
[13] Third slide
```

Scripts without timestamps continue to be narrated normally.

## Checks

```bash
npm run build
npm run test:e2e
```

The end-to-end test uses a real headless Chromium browser and performs real in-browser inference (so its first run downloads the model).

## Deploy to Vercel

Import the repository in Vercel. The included `vercel.json` selects Vite, runs `npm run build`, and serves the static `dist` output. No functions, environment variables, or API keys are required.
