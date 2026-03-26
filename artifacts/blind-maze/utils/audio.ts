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

export async function speak(text: string, interrupt = false) {
  if (Platform.OS === "web") {
    if ("speechSynthesis" in window) {
      if (interrupt) {
        window.speechSynthesis.cancel();
        queue.length = 0;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
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
    }
    return;
  }
  await Speech.stop();
  queue.length = 0;
  isSpeaking = false;
}

export const AUDIO = {
  welcome: "Welcome to Blind Maze. A game for all abilities. Swipe anywhere on the screen to move. Swipe up, down, left, or right. To return to the main menu, hold the bottom right corner for one second. Choose your difficulty below.",
  selectEasy: "Easy mode selected. 4 mazes, around 5 to 10 moves each.",
  selectMedium: "Medium mode selected. 3 mazes, around 10 to 15 moves each.",
  selectHard: "Hard mode selected. 3 mazes, around 15 to 20 moves each.",
  gameStart: (mazeName: string, moveTarget: number) =>
    `${mazeName}. Find the exit in about ${moveTarget} moves. Swipe to move.`,
  moved: (direction: string) => `Moved ${direction}`,
  blocked: (direction: string) => `Wall to the ${direction}`,
  won: (moves: number) => `Congratulations! You found the exit in ${moves} moves! Amazing!`,
  nextMaze: (mazeName: string) => `Next maze: ${mazeName}. Swipe to move.`,
  allDone: "You completed all mazes in this difficulty! Return to the menu to try a harder level.",
  returnMenu: "Returning to main menu.",
  easyButton: "Easy",
  mediumButton: "Medium",
  hardButton: "Hard",
  instructions: "Hold bottom right to exit to menu.",
};
