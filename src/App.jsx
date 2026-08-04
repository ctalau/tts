import { useEffect, useRef, useState } from "react";

const voices = [
  ["af_heart", "Heart", "American · warm"], ["af_bella", "Bella", "American · bright"],
  ["af_nicole", "Nicole", "American · calm"], ["am_fenrir", "Fenrir", "American · bold"],
  ["am_michael", "Michael", "American · clear"], ["bf_emma", "Emma", "British · soft"],
  ["bf_isabella", "Isabella", "British · poised"], ["bm_george", "George", "British · rich"],
];

const initialText = "Welcome to Kokoro Voice Studio. Your words become speech right here in your browser — private, fast, and beautifully human.";

function progressLabel(detail) {
  if (!detail) return "Preparing model…";
  if (detail.status === "progress" && Number.isFinite(detail.progress))
    return `Downloading voice model · ${Math.round(detail.progress)}%`;
  if (detail.status === "ready") return "Voice model ready";
  return "Preparing voice model…";
}

export default function App() {
  const [text, setText] = useState(initialText);
  const [voice, setVoice] = useState("af_heart");
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const worker = useRef(null);

  useEffect(() => () => {
    worker.current?.terminate();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const generate = () => {
    if (!text.trim() || busy) return;
    setBusy(true); setError(""); setStatus("Starting private speech engine…");
    if (!worker.current) {
      worker.current = new Worker(new URL("./tts.worker.js", import.meta.url), { type: "module" });
    }
    worker.current.onmessage = ({ data }) => {
      if (data.type === "progress") setStatus(progressLabel(data.detail));
      if (data.type === "status") setStatus(data.message);
      if (data.type === "result") {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(data.blob)); setBusy(false); setStatus("Your audio is ready");
      }
      if (data.type === "error") { setError(data.message); setBusy(false); setStatus(""); }
    };
    worker.current.onerror = () => { setError("The speech engine could not start. Try refreshing the page."); setBusy(false); };
    worker.current.postMessage({ type: "generate", text: text.trim(), voice, speed });
  };

  return <main>
    <header className="nav">
      <a className="brand" href="/" aria-label="Kokoro home"><span className="brand-mark">K</span><span>Kokoro</span></a>
      <div className="local-pill"><span /> 100% local · nothing uploaded</div>
    </header>

    <section className="hero">
      <p className="eyebrow">IN-BROWSER VOICE STUDIO</p>
      <h1>Give your words<br/><em>a voice.</em></h1>
      <p className="lede">Natural text-to-speech, created privately on your device.<br className="desktop"/> No account. No server. Just press play.</p>
    </section>

    <section className="studio" aria-label="Voice generator">
      <div className="field-head"><label htmlFor="script">Your script</label><span>{text.length} / 500</span></div>
      <textarea id="script" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write something worth hearing…" />

      <div className="controls">
        <div className="control"><label htmlFor="voice">Voice</label><div className="select-wrap">
          <select id="voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
            {voices.map(([id, name, note]) => <option key={id} value={id}>{name} — {note}</option>)}
          </select>
        </div></div>
        <div className="control"><label htmlFor="speed">Pace <output>{speed.toFixed(1)}×</output></label>
          <input id="speed" type="range" min="0.7" max="1.3" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}/>
          <div className="range-labels"><span>Slower</span><span>Natural</span><span>Faster</span></div>
        </div>
      </div>

      <button className="generate" onClick={generate} disabled={busy || !text.trim()}>
        <span className={busy ? "spinner" : "play"}>{busy ? "" : "▶"}</span>{busy ? "Working locally…" : "Create voice"}
      </button>
      {status && <p className="status" role="status">{status}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {audioUrl && <div className="audio-card">
        <div><strong>Generated speech</strong><span>WAV audio · ready to play</span></div>
        <audio controls src={audioUrl} data-testid="audio-player" />
        <a href={audioUrl} download="kokoro-speech.wav" className="download">Download WAV ↓</a>
      </div>}
      {!audioUrl && <p className="first-note">The first run downloads the compact voice model (about 90 MB). It stays cached for next time.</p>}
    </section>

    <footer><span>Powered by Kokoro-82M + Transformers.js</span><span>Runs entirely in your browser</span></footer>
  </main>;
}
