import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';

export default function FloatingMenu({ navigation }) {
  const [open, setOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    Animated.spring(animation, {
      toValue: open ? 0 : 1,
      friction: 5,
      useNativeDriver: true
    }).start();
    setOpen(!open);
  };

  const icons = [
    {
      icon: '⚙️',
      action: () => navigation.navigate('SettingsScreen')
    },
    {
      icon: '👤',
      action: () => navigation.navigate('ProfileTab', { screen: 'Profile' })
    },
    {
      icon: '🔔',
      action: () => navigation.navigate('Alerts')
    },
    {
      icon: '📁',
      action: () => navigation.navigate('CollectionsTab', { screen: 'Collections' })
    },
    {
      icon: '✍️',
      action: () => navigation.navigate('Compose')
    },
  ];

  const radius = 150;
  const angleStep = 90 / (icons.length - 1);

  const getButtonStyle = (index) => {
    const angle = (angleStep * index) * (Math.PI / 180);
    const x = -Math.cos(angle) * radius;
    const y = -Math.sin(angle) * radius;

    return {
      transform: [
        {
          translateX: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, x],
          }),
        },
        {
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, y],
          }),
        },
        { scale: animation },
        {
          rotate: animation.interpolate({
            inputRange: [0, 1],
            outputRange: ['-180deg', '0deg'],
          }),
        },
      ],
      opacity: animation,
    };
  };

  return (
    <View style={styles.container}>
      {icons.map((item, i) => (
        <Animated.View key={i} style={[styles.smallBtn, getButtonStyle(i)]}>
          <TouchableOpacity
            onPress={() => {
              toggleMenu();
              item.action();
            }}
          >
            <Text style={styles.icon}>{item.icon}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      <TouchableOpacity style={styles.mainBtn} onPress={toggleMenu}>
        <Text style={styles.mainIcon}>≡</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 70, right: 25 },
  mainBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff7b72',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  mainIcon: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  smallBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff7b72',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  icon: { color: '#fff', fontSize: 20 },
});
