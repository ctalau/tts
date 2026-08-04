const TIMESTAMP = /^\s*\[(\d+(?:\.\d+)?)\]\s*(.+?)\s*$/;

export function parseNarrationScript(script) {
  const lines = script.split(/\r?\n/).filter((line) => line.trim());
  const hasTimestamp = lines.some((line) => /^\s*\[/.test(line));

  if (!hasTimestamp) return { timed: false, segments: [{ start: 0, text: script.trim() }] };

  const segments = lines.map((line, index) => {
    const match = line.match(TIMESTAMP);
    if (!match) throw new Error(`Line ${index + 1} needs a timestamp like [7.2] followed by text.`);
    return { start: Number(match[1]), text: match[2] };
  });

  for (let index = 1; index < segments.length; index += 1) {
    if (segments[index].start < segments[index - 1].start) {
      throw new Error("Timestamps must be in chronological order.");
    }
  }
  return { timed: true, segments };
}

export function combineTimedAudio(clips, sampleRate) {
  const length = clips.reduce((maximum, { audio, start }) => (
    Math.max(maximum, Math.round(start * sampleRate) + audio.length)
  ), 0);
  const combined = new Float32Array(length);
  for (const { audio, start } of clips) {
    const offset = Math.round(start * sampleRate);
    for (let index = 0; index < audio.length; index += 1) {
      combined[offset + index] = Math.max(-1, Math.min(1, combined[offset + index] + audio[index]));
    }
  }
  return combined;
}

export function toWavBlob(audio, sampleRate) {
  const buffer = new ArrayBuffer(44 + audio.length * 2);
  const view = new DataView(buffer);
  const write = (offset, value) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + audio.length * 2, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, audio.length * 2, true);
  audio.forEach((sample, index) => view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true));
  return new Blob([buffer], { type: "audio/wav" });
}
