import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Coin from './Coin';

interface CoinPileProps {
  balance: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PILE_HEIGHT = 220;
const MIN_COIN_SIZE = 28;
const MAX_COIN_SIZE = 48;

export default function CoinPile({ balance }: CoinPileProps) {
  const coins = useMemo(() => {
    const coinCount = Math.min(Math.max(Math.floor(balance / 2), 3), 60);
    const generatedCoins: { 
      id: string; 
      x: number; 
      y: number; 
      size: number; 
      rotation: number;
      zIndex: number;
      delay: number;
    }[] = [];

    const rows = Math.ceil(coinCount / 8);
    
    for (let i = 0; i < coinCount; i++) {
      const row = Math.floor(i / 8);
      const size = MIN_COIN_SIZE + Math.random() * (MAX_COIN_SIZE - MIN_COIN_SIZE);
      
      const baseX = (i % 8) * (SCREEN_WIDTH / 9) + (SCREEN_WIDTH / 18);
      const xOffset = (Math.random() - 0.5) * 40;
      const x = Math.max(10, Math.min(SCREEN_WIDTH - size - 10, baseX + xOffset));
      
      const baseY = 20 + row * 35;
      const yOffset = Math.random() * 20;
      const y = baseY + yOffset;
      
      const rotation = (Math.random() - 0.5) * 30;

      generatedCoins.push({
        id: `coin-${i}-${Math.floor(balance)}`,
        x,
        y,
        size,
        rotation,
        zIndex: rows - row + Math.random() * 0.5,
        delay: i * 15,
      });
    }

    return generatedCoins.sort((a, b) => a.zIndex - b.zIndex);
  }, [balance]);

  return (
    <View style={styles.container}>
      <View style={styles.pile}>
        {coins.map((coin) => (
          <View
            key={coin.id}
            style={[
              styles.coinWrapper,
              {
                left: coin.x,
                bottom: coin.y,
                transform: [{ rotate: `${coin.rotation}deg` }],
                zIndex: Math.floor(coin.zIndex * 10),
              },
            ]}
          >
            <Coin size={coin.size} animateIn delay={coin.delay} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: PILE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  pile: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: PILE_HEIGHT,
  },
  coinWrapper: {
    position: 'absolute',
  },
});
