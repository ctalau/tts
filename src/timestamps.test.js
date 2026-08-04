import { describe, expect, it } from "vitest";
import { combineTimedAudio, parseNarrationScript, toWavBlob } from "./timestamps.js";

describe("parseNarrationScript", () => {
  it("extracts decimal timestamps and narration text", () => {
    expect(parseNarrationScript("[0] First slide\n[7.2] Second slide\n[13] Third")).toEqual({
      timed: true,
      segments: [
        { start: 0, text: "First slide" },
        { start: 7.2, text: "Second slide" },
        { start: 13, text: "Third" },
      ],
    });
  });

  it("keeps ordinary scripts compatible", () => {
    expect(parseNarrationScript("Hello\nworld").segments).toEqual([{ start: 0, text: "Hello\nworld" }]);
  });

  it("rejects incomplete and out-of-order schedules", () => {
    expect(() => parseNarrationScript("[0] First\nSecond")).toThrow("Line 2");
    expect(() => parseNarrationScript("[4] Later\n[2] Earlier")).toThrow("chronological");
  });
});

it("places clips at their requested sample offsets and encodes WAV", async () => {
  const audio = combineTimedAudio([
    { start: 0, audio: new Float32Array([0.25, 0.5]) },
    { start: 0.5, audio: new Float32Array([0.75]) },
  ], 4);
  expect([...audio]).toEqual([0.25, 0.5, 0.75]);
  const blob = toWavBlob(audio, 4);
  expect(blob.type).toBe("audio/wav");
  expect(new Uint8Array(await blob.arrayBuffer()).slice(0, 4)).toEqual(new Uint8Array([82, 73, 70, 70]));
});
