import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useColorScheme } from 'react-native';
import { colors } from '@/constants/colors';

interface CoinProps {
  size: number;
  animateIn?: boolean;
  delay?: number;
}

export default function Coin({ size, animateIn = false, delay = 0 }: CoinProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const scaleAnim = useRef(new Animated.Value(animateIn ? 0.3 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (animateIn) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateIn, scaleAnim, opacityAnim, delay]);

  const borderRadius = size / 2;

  return (
    <Animated.View
      style={[
        styles.coinContainer,
        {
          width: size,
          height: size,
          borderRadius,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.coinOuter,
          {
            borderRadius,
            backgroundColor: theme.coinSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.coinMiddle,
            {
              borderRadius: borderRadius - 2,
              backgroundColor: theme.coinPrimary,
            },
          ]}
        >
          <View
            style={[
              styles.coinInner,
              {
                borderRadius: borderRadius - 6,
                backgroundColor: theme.coinHighlight,
              },
            ]}
          />
          <View
            style={[
              styles.coinShine,
              {
                borderRadius: (size * 0.15) / 2,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  coinContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  coinOuter: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  coinMiddle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInner: {
    width: '55%',
    height: '55%',
    opacity: 0.4,
  },
  coinShine: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '15%',
    height: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
