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

import { AUDIO, playBell, speak, stopSpeaking, unlockAudio } from "@/utils/audio";
import { hapticMove, hapticWall, hapticWin } from "@/utils/haptics";
import {
  bfsFrom,
  bfsSolve,
  canMove,
  getHintDirection,
  getMazesByDifficulty,
  isAtExit,
  isCulDeSac,
  MazeData,
  movePlayer,
  type Cell,
} from "@/constants/mazes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SWIPE_THRESHOLD = 30;
const BOTTOM_RIGHT_ZONE = 100;
const HOLD_DURATION = 1000;

type Direction = "up" | "down" | "left" | "right";

export default function GameScreen() {
  const params = useLocalSearchParams<{ difficulty: string }>();
  const difficulty = (params.difficulty ?? "easy") as "easy" | "medium" | "hard";
  const insets = useSafeAreaInsets();

  const mazes = getMazesByDifficulty(difficulty);
  const [mazeIndex, setMazeIndex] = useState<number>(0);
  const [position, setPosition] = useState<Cell>(mazes[0].start);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [won, setWon] = useState<boolean>(false);
  const [allDone, setAllDone] = useState<boolean>(false);
  const [overlayDisplayText, setOverlayDisplayText] = useState<string>("");

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasSwiped = useRef(false);

  const wonRef = useRef(false);
  const allDoneRef = useRef(false);
  const mazeIndexRef = useRef(0);
  const moveCountRef = useRef(0);
  const positionRef = useRef<Cell>(mazes[0].start);
  const movesSinceHintRef = useRef(0);

  useEffect(() => { wonRef.current = won; }, [won]);
  useEffect(() => { allDoneRef.current = allDone; }, [allDone]);
  useEffect(() => { mazeIndexRef.current = mazeIndex; }, [mazeIndex]);
  useEffect(() => { moveCountRef.current = moveCount; }, [moveCount]);
  useEffect(() => { positionRef.current = position; }, [position]);

  const currentMaze: MazeData = mazes[mazeIndex];

  function showOverlay(text: string) {
    setOverlayDisplayText(text);
    if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
    overlayOpacity.setValue(1);
    overlayTimeout.current = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();
    }, 1200);
  }

  const goToMenu = useCallback(async () => {
    await hapticWin();
    await stopSpeaking();
    speak(AUDIO.returnMenu);
    router.replace("/");
  }, []);

  const isInBottomRight = (x: number, y: number): boolean => {
    return (
      x > SCREEN_WIDTH - BOTTOM_RIGHT_ZONE &&
      y > SCREEN_HEIGHT - BOTTOM_RIGHT_ZONE
    );
  };

  const handleWin = useCallback(
    async (moves: number) => {
      wonRef.current = true;
      setWon(true);
      await hapticWin();
      playBell();
      speak(AUDIO.won(moves), true);
      showOverlay("Exit Found!");

      setTimeout(async () => {
        const currentIndex = mazeIndexRef.current;
        if (currentIndex + 1 < mazes.length) {
          const nextMaze = mazes[currentIndex + 1];
          const nextIndex = currentIndex + 1;
          setMazeIndex(nextIndex);
          setPosition(nextMaze.start);
          setMoveCount(0);
          setWon(false);
          wonRef.current = false;
          mazeIndexRef.current = nextIndex;
          moveCountRef.current = 0;
          positionRef.current = nextMaze.start;
          speak(AUDIO.nextMaze(nextMaze.name), true);
          showOverlay(nextMaze.name);
        } else {
          allDoneRef.current = true;
          setAllDone(true);
          speak(AUDIO.allDone, true);
          showOverlay("All Done!");
        }
      }, 2800);
    },
    [mazes]
  );

  const handleMove = useCallback(
    (direction: Direction) => {
      unlockAudio();
      if (wonRef.current || allDoneRef.current) return;

      const maze = mazes[mazeIndexRef.current];
      const prev = positionRef.current;

      if (canMove(maze, prev, direction)) {
        const next = movePlayer(prev, direction);
        const newMoveCount = moveCountRef.current + 1;

        setPosition(next);
        setMoveCount(newMoveCount);
        positionRef.current = next;
        moveCountRef.current = newMoveCount;

        hapticMove();

        if (isAtExit(next, maze.exit)) {
          showOverlay(direction.toUpperCase());
          speak(direction, true);
          setTimeout(() => handleWin(newMoveCount), 200);
          return;
        }

        speak(AUDIO.moved(direction), true);

        if (isCulDeSac(maze, next)) {
          showOverlay("Dead End");
          hapticWall();
          speak(AUDIO.deadEnd);
        } else {
          showOverlay(direction.toUpperCase());
        }

        movesSinceHintRef.current += 1;

        if (newMoveCount % 5 === 0) {
          const stepsLeft = bfsFrom(maze, next);
          if (stepsLeft !== null) {
            speak(AUDIO.stepsLeft(stepsLeft));
          }
        }

        if (movesSinceHintRef.current >= 20) {
          movesSinceHintRef.current = 0;
          const hintDir = getHintDirection(maze, next);
          if (hintDir) {
            speak(AUDIO.hintStuck);
            speak(AUDIO.hint(hintDir));
            showOverlay("Hint");
          }
        }
      } else {
        hapticWall();
        speak(AUDIO.blocked(direction), true);
        showOverlay(`Wall ${direction}`);
      }
    },
    [mazes, handleWin]
  );

  const handleMoveRef = useRef(handleMove);
  useEffect(() => {
    handleMoveRef.current = handleMove;
  }, [handleMove]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        swipeStartRef.current = { x: pageX, y: pageY };
        hasSwiped.current = false;

        if (isInBottomRight(pageX, pageY)) {
          holdTimer.current = setTimeout(() => {
            goToMenu();
          }, HOLD_DURATION);
        }
      },

      onPanResponderMove: (_, gestureState) => {
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

  useEffect(() => {
    const maze = mazes[mazeIndex];
    const optimalMoves = bfsSolve(maze) ?? maze.minMoves;
    const msg = AUDIO.gameStart(maze.name, optimalMoves);
    movesSinceHintRef.current = 0;
    speak(msg, true);
    showOverlay(maze.name);
  }, [mazeIndex]);

  useEffect(() => {
    return () => {
      if (overlayTimeout.current) clearTimeout(overlayTimeout.current);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      stopSpeaking();
    };
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.fullScreen} {...panResponder.panHandlers}>
      <View style={[styles.header, { top: topPad + 8 }]}>
        <Text style={styles.mazeName}>{currentMaze.name}</Text>
        <Text style={styles.moveCount}>Moves: {moveCount}</Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.overlayContainer, { opacity: overlayOpacity }]}
      >
        <Text style={styles.overlayText}>{overlayDisplayText}</Text>
      </Animated.View>

      {allDone && (
        <View style={styles.allDoneContainer}>
          <Text style={styles.allDoneTitle}>Complete!</Text>
          <Text style={styles.allDoneText}>
            All {difficulty} mazes solved.{"\n"}Hold the bottom-right corner to go back.
          </Text>
        </View>
      )}

      <View
        style={[
          styles.bottomRightZone,
          { bottom: bottomPad + 12, right: 16 },
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
    color: "#333",
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
