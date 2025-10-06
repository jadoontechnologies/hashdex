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
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

export default function Header({
  title,
  rightIcon,
  onRightPress,
  colors = ["#F9F871", "#F28A47", "#DE5C76"],
}) {
  const navigation = useNavigation();

  const showBack = navigation.canGoBack();

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.heroArea}
    >
      <View style={styles.header}>
        {/* Left back button */}
        {showBack ? (
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack(); // ✅ always go back one step
              }
            }}
            style={styles.iconWrapper}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconWrapper} />
        )}

        {/* Title */}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        {/* Right button */}
        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconWrapper}>
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
    paddingBottom: 4,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  iconWrapper: {
    width: 30,
    alignItems: "center",
  },
});
