// src/components/Header.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

// ✅ Import the custom back button
import BackIcon from '../../assets/icons/back.png';

export default function Header({
  title = "Hashdex",                 // Default title
  rightIconComponent,                // Custom component (Image, etc.)
  onRightPress,                      // Function when right icon is pressed
  showBackButton = false,            // Show back button
  backTo = "Feed",                   // Fallback route
  colors = ["#F9F871", "#F28A47", "#DE5C76"], // Gradient colors
}) {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  const shouldShowBack = showBackButton || canGoBack;

  const handleBackPress = () => {
    if (canGoBack) navigation.goBack();
    else if (backTo) navigation.navigate(backTo);
  };

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.heroArea}
    >
      <View style={styles.header}>
        {/* 🔹 Back Button */}
        {shouldShowBack ? (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.iconWrapper}
            activeOpacity={0.7}
          >
            <Image
              source={BackIcon}
              style={{ width: 18, height: 18, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconWrapper} />
        )}

        {/* 🔹 Title */}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        {/* 🔹 Right Icon / Component */}
        <View style={styles.iconWrapper}>
          {rightIconComponent ? (
            <TouchableOpacity onPress={onRightPress} activeOpacity={0.7}>
              {rightIconComponent}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 25 : 50,
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
