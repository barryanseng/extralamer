import * as Speech from "expo-speech";
import { Platform } from "react-native";

let isSpeaking = false;
const queue: string[] = [];

function processQueue() {
  if (isSpeaking || queue.length === 0) return;
  const text = queue.shift()!;
  isSpeaking = true;
  Speech.speak(text, {
    language: "en-US",
    rate: 0.95,
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
  utterance.rate = 0.95;
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
    "Welcome to Wayfinder. A game designed for all abilities. Swipe up, down, left, or right anywhere on the screen to move. To return to the main menu at any time, hold the bottom right corner of the screen for one second. Three difficulties are available. Tap the top of the screen for Easy. Tap the middle for Medium. Tap the bottom for Hard.",
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
