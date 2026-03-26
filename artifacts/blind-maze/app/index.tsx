import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AUDIO, speak, stopSpeaking } from "@/utils/audio";
import { hapticSelect } from "@/utils/haptics";

type Difficulty = "easy" | "medium" | "hard";

function DifficultyButton({
  label,
  audioLabel,
  difficulty,
  onSelect,
}: {
  label: string;
  audioLabel: string;
  difficulty: Difficulty;
  onSelect: (d: Difficulty) => void;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    hapticSelect();
    onSelect(difficulty);
  };

  const handlePressIn = () => {
    speak(audioLabel, true);
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const borderColor =
    difficulty === "easy"
      ? "#2ECC71"
      : difficulty === "medium"
      ? "#F39C12"
      : "#E74C3C";

  const glowColor =
    difficulty === "easy"
      ? "rgba(46,204,113,0.12)"
      : difficulty === "medium"
      ? "rgba(243,156,18,0.12)"
      : "rgba(231,76,60,0.12)";

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={audioLabel}
      accessibilityRole="button"
      testID={`difficulty-${difficulty}`}
      style={{ width: "100%" }}
    >
      <Animated.View
        style={[
          styles.difficultyBtn,
          {
            borderColor,
            backgroundColor: glowColor,
            transform: [{ scale: pressAnim }],
          },
        ]}
      >
        <Text style={[styles.difficultyLabel, { color: borderColor }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!hasSpoken.current) {
      hasSpoken.current = true;
      const timeout = setTimeout(() => {
        speak(AUDIO.welcome);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleSelect = async (difficulty: Difficulty) => {
    await stopSpeaking();
    if (difficulty === "easy") speak(AUDIO.easySelected, true);
    else if (difficulty === "medium") speak(AUDIO.mediumSelected, true);
    else speak(AUDIO.hardSelected, true);

    setTimeout(() => {
      router.push({ pathname: "/game", params: { difficulty } });
    }, 900);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 20;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPad,
          paddingBottom: bottomPad,
        },
      ]}
    >
      <View style={{ alignItems: "center" }}>
        <Text style={styles.title}>BLIND{"\n"}MAZE</Text>
        <View style={styles.titleDivider} />
        <Text style={styles.subtitle}>Audio-Guided Navigation</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <DifficultyButton
          label="EASY"
          audioLabel={AUDIO.easyButton}
          difficulty="easy"
          onSelect={handleSelect}
        />
        <DifficultyButton
          label="MEDIUM"
          audioLabel={AUDIO.mediumButton}
          difficulty="medium"
          onSelect={handleSelect}
        />
        <DifficultyButton
          label="HARD"
          audioLabel={AUDIO.hardButton}
          difficulty="hard"
          onSelect={handleSelect}
        />
      </View>

      <View style={{ alignItems: "center" }}>
        <Text style={styles.hint}>Swipe anywhere to move</Text>
        <Text style={styles.hintSub}>Hold bottom-right to return to menu</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 12,
    lineHeight: 64,
  },
  titleDivider: {
    width: 48,
    height: 2,
    backgroundColor: "#333",
    marginTop: 16,
    marginBottom: 12,
  },
  subtitle: {
    color: "#444",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
  },
  difficultyBtn: {
    width: "100%",
    paddingVertical: 28,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyLabel: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 6,
  },
  hint: {
    color: "#2a2a2a",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  hintSub: {
    color: "#222",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
