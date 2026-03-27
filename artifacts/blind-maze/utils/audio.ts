import * as Speech from "expo-speech";
import { createAudioPlayer } from "expo-audio";
import { Platform } from "react-native";

let bellPlayer: ReturnType<typeof createAudioPlayer> | null = null;

// Shared AudioContext reused across calls so the browser never suspends it unexpectedly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webAudioCtx: any = null;

function getWebAudioCtx() {
  if (typeof window === "undefined") return null;
  // @ts-ignore
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!webAudioCtx) webAudioCtx = new AudioCtx();
  return webAudioCtx;
}

// Call this on every user gesture so the context is always in "running" state.
export function unlockAudio() {
  const ctx = getWebAudioCtx();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function ringBell(ctx: any) {
  const freqs = [523.25, 1046.5, 1568.0];
  const amps  = [0.55,   0.25,   0.12];
  const now = ctx.currentTime;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(amps[i], now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.8);
  });
}

export function playBell() {
  if (Platform.OS === "web") {
    const ctx = getWebAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => ringBell(ctx));
    } else {
      ringBell(ctx);
    }
    return;
  }
  try {
    if (!bellPlayer) {
      bellPlayer = createAudioPlayer(require("../assets/sounds/bell.wav"));
    }
    bellPlayer.seekTo(0);
    bellPlayer.play();
  } catch {
  }
}

let isSpeaking = false;
const queue: string[] = [];

function processQueue() {
  if (isSpeaking || queue.length === 0) return;
  const text = queue.shift()!;
  isSpeaking = true;
  Speech.speak(text, {
    language: "en-US",
    rate: 1.0,
    pitch: 1.0,
    onDone: () => {
      isSpeaking = false;
      processQueue();
    },
    onError: () => {
      isSpeaking = false;
      processQueue();
    },
    onStopped: () => {
      isSpeaking = false;
      processQueue();
    },
  });
}

let webSpeaking = false;
const webQueue: string[] = [];

function processWebQueue() {
  if (webSpeaking || webQueue.length === 0) return;
  if (!("speechSynthesis" in window)) return;
  const text = webQueue.shift()!;
  webSpeaking = true;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.0;
  utterance.onend = () => {
    webSpeaking = false;
    processWebQueue();
  };
  utterance.onerror = () => {
    webSpeaking = false;
    processWebQueue();
  };
  window.speechSynthesis.speak(utterance);
}

export async function speak(text: string, interrupt = false) {
  if (Platform.OS === "web") {
    if ("speechSynthesis" in window) {
      if (interrupt) {
        window.speechSynthesis.cancel();
        webQueue.length = 0;
        webSpeaking = false;
      }
      webQueue.push(text);
      processWebQueue();
    }
    return;
  }

  if (interrupt) {
    await Speech.stop();
    queue.length = 0;
    isSpeaking = false;
  }
  queue.push(text);
  processQueue();
}

export async function stopSpeaking() {
  if (Platform.OS === "web") {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      webQueue.length = 0;
      webSpeaking = false;
    }
    return;
  }
  await Speech.stop();
  queue.length = 0;
  isSpeaking = false;
}

export const AUDIO = {
  welcome:
    "Wayfinder. Solve an invisible maze by swiping to move. Find the exit. Hold bottom-right to return to menu. Tap top for Easy, middle for Medium, bottom for Hard.",
  easySelected: "Easy selected. Four mazes, short paths.",
  mediumSelected: "Medium selected. Three mazes, moderate paths.",
  hardSelected: "Hard selected. Three mazes, longer paths.",
  easyButton: "Easy mode. Beginner friendly.",
  mediumButton: "Medium mode. Some twists.",
  hardButton: "Hard mode. Full spiral paths.",
  gameStart: (mazeName: string, moveTarget: number) =>
    `${mazeName}. Find the exit in about ${moveTarget} moves. Swipe to move.`,
  moved: (direction: string) => direction,
  blocked: (direction: string) => `Wall to the ${direction}.`,
  deadEnd: "Dead end.",
  stepsLeft: (n: number) => n === 1 ? "One step to exit." : `${n} steps to exit.`,
  won: (moves: number) => `You found the exit in ${moves} moves. Excellent!`,
  nextMaze: (mazeName: string) =>
    `Well done! Next maze: ${mazeName}. Swipe to move.`,
  allDone:
    "You completed all mazes in this difficulty. Return to the menu to try a harder level.",
  returnMenu: "Returning to main menu.",
  hint: (direction: string) =>
    `Hint: try going ${direction}.`,
  hintStuck: "You seem stuck. Here is a hint.",
};
