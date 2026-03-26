import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AUDIO,
  speak,
  stopSpeaking,
} from "@/utils/audio";
import { hapticMove, hapticWall, hapticWin } from "@/utils/haptics";
import {
  canMove,
  getMazesByDifficulty,
  isAtExit,
  MazeData,
  movePlayer,
  type Cell,
} from "@/constants/mazes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SWIPE_THRESHOLD = 30;
const BOTTOM_RIGHT_ZONE = 100;
const HOLD_DURATION = 1000;

export default function GameScreen() {
  const params = useLocalSearchParams<{ difficulty: "easy" | "medium" | "hard" }>();
  const difficulty = params.difficulty ?? "easy";
  const insets = useSafeAreaInsets();

  const mazes = getMazesByDifficulty(difficulty);
  const [mazeIndex, setMazeIndex] = useState<number>(0);
  const [position, setPosition] = useState<Cell>(mazes[0].start);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [won, setWon] = useState<boolean>(false);
  const [allDone, setAllDone] = useState<boolean>(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayText = useRef<string>("");
  const overlayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStart = useRef<{ x: number; y: number } | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasSwiped = useRef(false);

  const currentMaze: MazeData = mazes[mazeIndex];

  function showOverlay(text: string) {
    overlayText.current = text;
    if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
    overlayOpacity.setValue(1);
    overlayTimeout.current = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    }, 1400);
  }

  const goToMenu = useCallback(async () => {
    await stopSpeaking();
    speak(AUDIO.returnMenu);
    router.replace("/");
  }, []);

  const isInBottomRight = (x: number, y: number): boolean => {
    const screenH = Platform.OS === "web" ? SCREEN_HEIGHT : SCREEN_HEIGHT;
    const screenW = Platform.OS === "web" ? SCREEN_WIDTH : SCREEN_WIDTH;
    return x > screenW - BOTTOM_RIGHT_ZONE && y > screenH - BOTTOM_RIGHT_ZONE;
  };

  const handleWin = useCallback(
    async (moves: number) => {
      setWon(true);
      await hapticWin();
      const msg = AUDIO.won(moves);
      speak(msg, true);
      showOverlay("You found the exit!");

      setTimeout(async () => {
        if (mazeIndex + 1 < mazes.length) {
          const nextMaze = mazes[mazeIndex + 1];
          setMazeIndex(mazeIndex + 1);
          setPosition(nextMaze.start);
          setMoveCount(0);
          setWon(false);
          speak(AUDIO.nextMaze(nextMaze.name));
        } else {
          setAllDone(true);
          speak(AUDIO.allDone, true);
        }
      }, 2500);
    },
    [mazeIndex, mazes]
  );

  const handleMove = useCallback(
    async (direction: "up" | "down" | "left" | "right") => {
      if (won || allDone) return;

      setPosition((prev) => {
        const maze = mazes[mazeIndex];
        if (canMove(maze, prev, direction)) {
          const next = movePlayer(prev, direction);
          const newMoveCount = moveCount + 1;
          setMoveCount(newMoveCount);
          hapticMove();
          speak(AUDIO.moved(direction));
          showOverlay(direction.toUpperCase());

          if (isAtExit(next, maze.exit)) {
            setTimeout(() => handleWin(newMoveCount), 100);
          }
          return next;
        } else {
          hapticWall();
          speak(AUDIO.blocked(direction));
          showOverlay(`Wall ${direction}`);
          return prev;
        }
      });
    },
    [won, allDone, mazeIndex, mazes, moveCount, handleWin]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        swipeStartRef.current = { x: pageX, y: pageY };
        hasSwiped.current = false;

        if (isInBottomRight(pageX, pageY)) {
          holdStart.current = { x: pageX, y: pageY };
          holdTimer.current = setTimeout(() => {
            goToMenu();
          }, HOLD_DURATION);
        }
      },

      onPanResponderMove: (e, gestureState) => {
        if (hasSwiped.current) return;

        if (holdTimer.current) {
          const dx = Math.abs(gestureState.dx);
          const dy = Math.abs(gestureState.dy);
          if (dx > 10 || dy > 10) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
          }
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }

        if (hasSwiped.current) return;

        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

        hasSwiped.current = true;

        if (absDx > absDy) {
          handleMoveRef.current(dx > 0 ? "right" : "left");
        } else {
          handleMoveRef.current(dy > 0 ? "down" : "up");
        }
      },

      onPanResponderTerminate: () => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
      },
    })
  ).current;

  const handleMoveRef = useRef(handleMove);
  useEffect(() => {
    handleMoveRef.current = handleMove;
  }, [handleMove]);

  useEffect(() => {
    return () => {
      if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    const maze = mazes[mazeIndex];
    const msg = AUDIO.gameStart(maze.name, maze.minMoves);
    speak(msg, true);
    showOverlay(maze.name);
  }, [mazeIndex]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.fullScreen} {...panResponder.panHandlers}>
      <View
        style={[
          styles.header,
          {
            top: topPad + 8,
          },
        ]}
      >
        <Text style={styles.mazeName}>{currentMaze.name}</Text>
        <Text style={styles.moveCount}>Moves: {moveCount}</Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.overlayContainer, { opacity: overlayOpacity }]}
      >
        <Text style={styles.overlayText}>{overlayText.current}</Text>
      </Animated.View>

      {allDone && (
        <View style={styles.allDoneContainer}>
          <Text style={styles.allDoneTitle}>All Done!</Text>
          <Text style={styles.allDoneText}>
            You conquered all {difficulty} mazes.{"\n"}Hold the bottom-right corner to go back.
          </Text>
        </View>
      )}

      <View
        style={[
          styles.bottomRightZone,
          {
            bottom: bottomPad + 12,
            right: 16,
          },
        ]}
      >
        <Text style={styles.bottomRightHint}>hold</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#000000",
    width: "100%",
    height: "100%",
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  mazeName: {
    color: "#1a1a1a",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  moveCount: {
    color: "#1a1a1a",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    letterSpacing: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    pointerEvents: "none",
  },
  overlayText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    textTransform: "uppercase",
    opacity: 0.95,
  },
  allDoneContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    zIndex: 30,
  },
  allDoneTitle: {
    color: "#2ECC71",
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    letterSpacing: 8,
    marginBottom: 20,
  },
  allDoneText: {
    color: "#444",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  bottomRightZone: {
    position: "absolute",
    width: BOTTOM_RIGHT_ZONE,
    height: BOTTOM_RIGHT_ZONE,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    zIndex: 5,
  },
  bottomRightHint: {
    color: "#1c1c1c",
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
