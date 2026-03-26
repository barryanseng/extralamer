import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AUDIO, speak, stopSpeaking } from "@/utils/audio";
import { hapticSelect } from "@/utils/haptics";

type Difficulty = "easy" | "medium" | "hard";

export default function MenuScreen() {
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const hasInteracted = useRef(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const selectedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(instructionOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
      Animated.delay(2800),
      Animated.timing(instructionOpacity, {
        toValue: 0,
        duration: 900,
        useNativeDriver: false,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();

    const t = setTimeout(() => {
      speak(AUDIO.welcome);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  function flashLabel(label: string) {
    setSelectedLabel(label);
    selectedOpacity.setValue(1);
    Animated.timing(selectedOpacity, {
      toValue: 0,
      duration: 800,
      delay: 600,
      useNativeDriver: false,
      easing: Easing.in(Easing.ease),
    }).start();
  }

  const handleSelect = async (difficulty: Difficulty) => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
    }
    await hapticSelect();
    await stopSpeaking();

    const label =
      difficulty === "easy" ? "EASY" : difficulty === "medium" ? "MEDIUM" : "HARD";
    flashLabel(label);

    if (difficulty === "easy") speak(AUDIO.easySelected, true);
    else if (difficulty === "medium") speak(AUDIO.mediumSelected, true);
    else speak(AUDIO.hardSelected, true);

    setTimeout(() => {
      router.push({ pathname: "/game", params: { difficulty } });
    }, 900);
  };

  const handleFirstTouch = () => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      speak(AUDIO.welcome, true);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.zone}
        onPress={() => handleSelect("easy")}
        onPressIn={handleFirstTouch}
        accessibilityLabel="Easy difficulty"
        accessibilityRole="button"
      />
      <Pressable
        style={styles.zone}
        onPress={() => handleSelect("medium")}
        onPressIn={handleFirstTouch}
        accessibilityLabel="Medium difficulty"
        accessibilityRole="button"
      />
      <Pressable
        style={styles.zone}
        onPress={() => handleSelect("hard")}
        onPressIn={handleFirstTouch}
        accessibilityLabel="Hard difficulty"
        accessibilityRole="button"
      />

      <Animated.View
        style={[styles.overlay, { opacity: instructionOpacity, pointerEvents: "none" }]}
      >
        <Text style={styles.instructionTitle}>WAYFINDER</Text>
        <Text style={styles.instructionLine}>Tap top for Easy</Text>
        <Text style={styles.instructionLine}>Tap middle for Medium</Text>
        <Text style={styles.instructionLine}>Tap bottom for Hard</Text>
        <Text style={styles.instructionSub}>Swipe to move · Hold bottom-right to return</Text>
      </Animated.View>

      <Animated.View
        style={[styles.overlay, { opacity: selectedOpacity, pointerEvents: "none" }]}
      >
        <Text style={styles.selectedLabel}>{selectedLabel}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    flexDirection: "column",
  },
  zone: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    pointerEvents: "none",
  },
  instructionTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: 10,
    marginBottom: 32,
  },
  instructionLine: {
    color: "#888888",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    marginBottom: 10,
  },
  instructionSub: {
    color: "#333333",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    marginTop: 24,
    textAlign: "center",
  },
  selectedLabel: {
    color: "#FFFFFF",
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    letterSpacing: 10,
  },
});
