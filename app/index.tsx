import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  useColorScheme,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Settings, Minus, X, Check } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBalance } from '@/contexts/BalanceContext';
import CoinPile from '@/components/CoinPile';
import FlyingCoin from '@/components/FlyingCoin';
import { colors } from '@/constants/colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlyingCoinData {
  id: string;
  startX: number;
  startY: number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  
  const { balance, dailyAllowance, isLoading, todayAllowanceAdded, spend, setDailyAllowance } = useBalance();

  const [spendOverlayVisible, setSpendOverlayVisible] = useState<boolean>(false);
  const [spendAmount, setSpendAmount] = useState<string>('');
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [newAllowance, setNewAllowance] = useState<string>('');
  const [flyingCoins, setFlyingCoins] = useState<FlyingCoinData[]>([]);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const settingsSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const settingsOpacity = useRef(new Animated.Value(0)).current;

  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 400,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handleSpendPress = () => {
    console.log('[HomeScreen] Spend button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSpendAmount('');
    setSpendOverlayVisible(true);
  };

  const handleSpendConfirm = () => {
    const amount = parseFloat(spendAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      console.warn('[HomeScreen] Invalid spend amount:', spendAmount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    console.log('[HomeScreen] Confirming spend:', amount);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const coinsToFly = Math.min(Math.floor(amount / 2) + 1, 8);
    const newFlyingCoins: FlyingCoinData[] = [];
    
    for (let i = 0; i < coinsToFly; i++) {
      const startX = Math.random() * (SCREEN_WIDTH - 40);
      const startY = SCREEN_HEIGHT - 200 + Math.random() * 80;
      newFlyingCoins.push({
        id: `flying-${Date.now()}-${i}`,
        startX,
        startY,
      });
    }

    setFlyingCoins([...flyingCoins, ...newFlyingCoins]);
    spend(amount);
    setSpendOverlayVisible(false);
    setSpendAmount('');
  };

  const openSettings = () => {
    console.log('[HomeScreen] Settings button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewAllowance(dailyAllowance.toString());
    setSettingsVisible(true);
    
    Animated.parallel([
      Animated.spring(settingsSlide, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(settingsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSettings = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.spring(settingsSlide, {
        toValue: SCREEN_HEIGHT,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(settingsOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSettingsVisible(false);
    });
  };

  const handleSaveAllowance = () => {
    const amount = parseFloat(newAllowance.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      console.warn('[HomeScreen] Invalid allowance amount:', newAllowance);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    console.log('[HomeScreen] Saving new allowance:', amount);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDailyAllowance(amount);
    closeSettings();
  };

  const removeFlyingCoin = useCallback((id: string) => {
    setFlyingCoins((prev) => prev.filter((coin) => coin.id !== id));
  }, []);

  const formatBalance = (value: number) => {
    const [whole, decimal] = value.toFixed(2).split('.');
    return { whole, decimal };
  };

  const { whole, decimal } = formatBalance(balance);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Enough</Text>
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: theme.surface }]} 
            onPress={openSettings}
            activeOpacity={0.7}
          >
            <Settings size={20} color={theme.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.balanceCard}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
              CURRENT BALANCE
            </Text>
            <View style={styles.balanceRow}>
              <Text style={[styles.currencySymbol, { color: theme.text }]}>€</Text>
              <Text style={[styles.balanceWhole, { color: theme.text }]}>{whole}</Text>
              <Text style={[styles.balanceDecimal, { color: theme.textTertiary }]}>.{decimal}</Text>
            </View>
            {todayAllowanceAdded && (
              <View style={[styles.allowanceBadge, { backgroundColor: isDark ? 'rgba(48, 209, 88, 0.15)' : 'rgba(52, 199, 89, 0.12)' }]}>
                <Text style={[styles.allowanceText, { color: theme.success }]}>
                  +€{dailyAllowance.toFixed(2)} added today
                </Text>
              </View>
            )}
          </View>

          <Animated.View style={[styles.spendButtonWrapper, { transform: [{ scale: buttonScale }] }]}>
            <Pressable
              style={[styles.spendButton, { backgroundColor: theme.text }]}
              onPress={handleSpendPress}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Minus size={24} color={theme.background} strokeWidth={2.5} />
              <Text style={[styles.spendButtonText, { color: theme.background }]}>Spend</Text>
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.coinPileContainer}>
          <CoinPile balance={balance} />
        </View>
      </SafeAreaView>

      {flyingCoins.map((coin) => (
        <FlyingCoin
          key={coin.id}
          startX={coin.startX}
          startY={coin.startY}
          onComplete={() => removeFlyingCoin(coin.id)}
        />
      ))}

      <Modal
        visible={spendOverlayVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpendOverlayVisible(false)}
      >
        <BlurView 
          intensity={isDark ? 40 : 60} 
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurOverlay}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Pressable
              style={styles.overlayTouchable}
              onPress={() => setSpendOverlayVisible(false)}
            >
              <Pressable 
                style={[styles.spendCard, { backgroundColor: theme.surface }]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.spendCardHeader}>
                  <Text style={[styles.spendCardTitle, { color: theme.text }]}>
                    Enter Amount
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setSpendOverlayVisible(false)}
                    style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                  >
                    <X size={18} color={theme.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                  <Text style={[styles.inputCurrency, { color: theme.textTertiary }]}>€</Text>
                  <TextInput
                    style={[styles.amountInput, { color: theme.text }]}
                    value={spendAmount}
                    onChangeText={setSpendAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.textTertiary}
                    autoFocus
                    selectionColor={theme.accent}
                  />
                </View>

                <View style={styles.quickAmounts}>
                  {[5, 10, 20, 50].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={[styles.quickAmountButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSpendAmount(amount.toString());
                      }}
                    >
                      <Text style={[styles.quickAmountText, { color: theme.text }]}>€{amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: theme.text }]}
                  onPress={handleSpendConfirm}
                  activeOpacity={0.8}
                >
                  <Check size={20} color={theme.background} strokeWidth={2.5} />
                  <Text style={[styles.confirmButtonText, { color: theme.background }]}>
                    Confirm Spend
                  </Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {settingsVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View 
            style={[
              styles.settingsBackdrop, 
              { opacity: settingsOpacity }
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); closeSettings(); }} />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.settingsSheet, 
              { 
                backgroundColor: theme.surface,
                transform: [{ translateY: settingsSlide }],
                maxHeight: SCREEN_HEIGHT * 0.8,
              }
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
              <View style={styles.sheetHandle}>
                <View style={[styles.handleBar, { backgroundColor: theme.textTertiary }]} />
              </View>
              
              <View style={styles.settingsHeader}>
                <Text style={[styles.settingsTitle, { color: theme.text }]}>Settings</Text>
              </View>

              <ScrollView 
                style={styles.settingsScrollView}
                contentContainerStyle={[styles.settingsContent, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                  <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>
                    Daily Allowance
                  </Text>
                  <View style={[styles.settingsInputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={[styles.inputCurrency, { color: theme.textTertiary }]}>€</Text>
                    <TextInput
                      style={[styles.settingsInput, { color: theme.text }]}
                      value={newAllowance}
                      onChangeText={setNewAllowance}
                      keyboardType="decimal-pad"
                      placeholder="10.00"
                      placeholderTextColor={theme.textTertiary}
                      selectionColor={theme.accent}
                    />
                  </View>
                  
                  <Text style={[styles.settingsHint, { color: theme.textTertiary }]}>
                    This amount will be added to your balance at midnight each day.
                  </Text>

                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.text }]}
                    onPress={handleSaveAllowance}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.saveButtonText, { color: theme.background }]}>
                      Save Changes
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '500' as const,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: 48,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '300' as const,
    marginTop: 8,
    marginRight: 4,
  },
  balanceWhole: {
    fontSize: 72,
    fontWeight: '700' as const,
    letterSpacing: -3,
    lineHeight: 80,
  },
  balanceDecimal: {
    fontSize: 36,
    fontWeight: '400' as const,
    marginTop: 8,
  },
  allowanceBadge: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  allowanceText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  spendButtonWrapper: {
    marginTop: 8,
  },
  spendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 28,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  spendButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  coinPileContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurOverlay: {
    flex: 1,
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  spendCard: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 24,
  },
  spendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  spendCardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  inputCurrency: {
    fontSize: 28,
    fontWeight: '500' as const,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: -1,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  settingsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.3,
  },
  settingsHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  settingsKeyboardAvoid: {
    flex: 1,
  },
  settingsScrollView: {
    flex: 1,
  },
  settingsContent: {
    padding: 24,
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  settingsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
  },
  settingsInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600' as const,
  },
  settingsHint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
