// src/components/Header.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Header({
  title = "Hashdex", // Default title
  rightIcon,
  onRightPress,
  showBackButton = false,
  backTo = "Feed", // Default fallback route
  colors = ["#F9F871", "#F28A47", "#DE5C76"], // Gradient colors
}) {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  const shouldShowBack = showBackButton || canGoBack;

  const handleBackPress = () => {
    if (canGoBack) {
      navigation.goBack();
    } else if (backTo) {
      navigation.navigate(backTo);
    }
  };

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.heroArea}
    >
      <View style={styles.header}>
        {/* 🔹 Back Button (if available) */}
        {shouldShowBack ? (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.iconWrapper}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconWrapper} />
        )}

        {/* 🔹 Title */}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        {/* 🔹 Right Icon (if provided) */}
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconWrapper}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={26} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconWrapper} />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroArea: {
    paddingTop:
      Platform.OS === "android" ? StatusBar.currentHeight || 25 : 50,
    paddingBottom: 8,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  iconWrapper: {
    width: 30,
    alignItems: "center",
  },
});
