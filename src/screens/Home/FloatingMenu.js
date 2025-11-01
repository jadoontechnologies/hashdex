import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function FloatingMenu({ navigation }) {
  const [open, setOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    Animated.spring(animation, {
      toValue: open ? 0 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const icons = [
    {
      name: 'settings',
      action: () => navigation.navigate('SettingsScreen'),
    },
    {
      name: 'user',
      action: () => navigation.navigate('ProfileTab', { screen: 'Profile' }),
    },
    {
      name: 'users',
      action: () => navigation.navigate('ProfileTab', { screen: 'Friends' }),
    },
    {
      name: 'folder',
      action: () =>
        navigation.navigate('CollectionsTab', { screen: 'Collections' }),
    },
    {
      name: 'edit-3',
      action: () => navigation.navigate('Compose'),
    },
  ];

  const radius = 150;
  const angleStep = 90 / (icons.length - 1);

  const getButtonStyle = (index) => {
    const angle = angleStep * index * (Math.PI / 180);
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
            <Feather name={item.name} size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      ))}

      <TouchableOpacity style={styles.mainBtn} onPress={toggleMenu}>
        <Feather name={open ? 'x' : 'menu'} size={28} color="#fff" />
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
});
