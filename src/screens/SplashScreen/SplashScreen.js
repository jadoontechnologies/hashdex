import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
    return (
        <LinearGradient 
            colors={["#F9F871", "#F28A47", "#DE5C76"]}
            style={styles.container}
        >
            <Image
                source={require("../../../assets/images/ic_logo.png")}
                style={styles.logo}
                resizeMode="contain"
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: width,
        height: height,
    },
    logo: {
        width: 200,
        height: 200,
    },
});
