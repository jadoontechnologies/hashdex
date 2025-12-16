import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';

// Import all your PNGs
import MoreIcon from '../../../assets/icons/more.png';
import SettingsIcon from '../../../assets/icons/settings.png';
import UserIcon from '../../../assets/icons/users.png';
import UsersIcon from '../../../assets/icons/user.png';
import FolderIcon from '../../../assets/icons/collection.png';
import EditIcon from '../../../assets/icons/post.png';

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

  // Sub-buttons with manual icons
  const icons = [
    { icon: SettingsIcon, action: () => navigation.navigate('ProfileTab', { screen: 'SettingsScreen' }) },
    { icon: UserIcon, action: () => navigation.navigate('ProfileTab', { screen: 'Profile' }) },
    { icon: UsersIcon, action: () => navigation.navigate('ProfileTab', { screen: 'Friends' }) },
    { icon: FolderIcon, action: () => navigation.navigate('CollectionsTab', { screen: 'Collections' }) },
    { icon: EditIcon, action: () => navigation.navigate('Compose') },
  ];

  const radius = 150;
  const angleStep = 90 / (icons.length - 1);

  const getButtonStyle = (index) => {
    const angle = angleStep * index * (Math.PI / 180);
    const x = -Math.cos(angle) * radius;
    const y = -Math.sin(angle) * radius;

    return {
      transform: [
        { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
        { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
        { scale: animation },
      ],
      opacity: animation,
    };
  };

  return (
    <View style={styles.container}>
      {/* Sub-buttons */}
      {icons.map((item, i) => (
        <Animated.View key={i} style={[styles.smallBtn, getButtonStyle(i)]}>
          <TouchableOpacity
            onPress={() => {
              toggleMenu();
              item.action();
            }}
          >
            <Image source={item.icon} style={styles.iconImage} />
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Main FAB */}
      <TouchableOpacity style={styles.mainBtn} onPress={toggleMenu}>
        <Image source={MoreIcon} style={styles.mainIcon} />
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
  mainIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
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
  iconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
});
