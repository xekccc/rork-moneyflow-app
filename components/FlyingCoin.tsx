import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import Coin from './Coin';

interface FlyingCoinProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FlyingCoin({ startX, startY, onComplete }: FlyingCoinProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetY = -SCREEN_HEIGHT * 0.6;
    const targetX = (Math.random() - 0.5) * 80;
    const rotations = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: targetY,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: rotations,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.4,
          duration: 650,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [translateY, translateX, rotate, scale, opacity, onComplete]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-540, 0, 540],
    outputRange: ['-540deg', '0deg', '540deg'],
  });

  return (
    <Animated.View
      style={[
        styles.flyingCoin,
        {
          left: startX,
          top: startY,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
            { scale },
          ],
        },
      ]}
    >
      <Coin size={36} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flyingCoin: {
    position: 'absolute',
    zIndex: 1000,
  },
});
