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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Settings, X, Check, Sparkles, TrendingDown } from 'lucide-react-native';
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
  const [isKeyboardOffsetEnabled, setIsKeyboardOffsetEnabled] = useState<boolean>(false);
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
    
    Keyboard.dismiss();
    setNewAllowance(dailyAllowance.toString());
    setIsKeyboardOffsetEnabled(false);
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
    ]).start(() => {
      setIsKeyboardOffsetEnabled(true);
    });
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
      setIsKeyboardOffsetEnabled(false);
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
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.backgroundGradientStart, theme.backgroundGradientMid, theme.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.decorativePattern}>
        <View style={[styles.wave, styles.wave1, { backgroundColor: theme.wave1 }]} />
        <View style={[styles.wave, styles.wave2, { backgroundColor: theme.wave2 }]} />
        <View style={[styles.wave, styles.wave3, { backgroundColor: theme.wave3 }]} />
      </View>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sparkles size={20} color={theme.gold} strokeWidth={2.5} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Daily Allowance</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Track your spending</Text>
          </View>
          <TouchableOpacity 
            style={[styles.settingsButton, { 
              backgroundColor: theme.surface,
            }]} 
            onPress={openSettings}
            activeOpacity={0.7}
          >
            <Settings size={20} color={theme.mint} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.pixiuContainer}>
            <View style={[styles.pixiuGlow, { backgroundColor: theme.gold }]} />
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2mko0tb9xkb2vywtyipr3' }}
              style={styles.pixiuImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.balanceCard}>
            <View style={[styles.balanceFrame, {
              backgroundColor: theme.surface,
            }]}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                CURRENT BALANCE
              </Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.currencySymbol, { color: theme.mint }]}>€</Text>
                <Text style={[styles.balanceWhole, { 
                  color: theme.text,
                }]}>{whole}</Text>
                <Text style={[styles.balanceDecimal, { color: theme.textSecondary }]}>.{decimal}</Text>
              </View>
              {todayAllowanceAdded && (
                <View style={[styles.allowanceBadge, { 
                  backgroundColor: theme.mintPale,
                }]}>
                  <Sparkles size={12} color={theme.mint} strokeWidth={2.5} />
                  <Text style={[styles.allowanceText, { color: theme.mint }]}>
                    +€{dailyAllowance.toFixed(2)} added today
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Animated.View style={[styles.spendButtonWrapper, { transform: [{ scale: buttonScale }] }]}>
            <Pressable
              style={[styles.spendButton, {
                backgroundColor: theme.peach,
                shadowColor: theme.peach,
              }]}
              onPress={handleSpendPress}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <LinearGradient
                colors={[theme.peach, theme.peachLight]}
                style={styles.spendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
              >
                <TrendingDown size={22} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.spendButtonText}>Spend</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.coinPileContainer} pointerEvents="box-none">
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
                  <View>
                    <Text style={[styles.spendCardTitle, { color: theme.text }]}>
                      Enter Amount
                    </Text>
                    <Text style={[styles.spendCardSubtitle, { color: theme.textSecondary }]}>
                      How much did you spend?
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setSpendOverlayVisible(false)}
                    style={[styles.closeButton, { backgroundColor: theme.surfaceSecondary }]}
                  >
                    <X size={18} color={theme.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.inputContainer, { backgroundColor: theme.surfaceSecondary }]}>
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
                      style={[styles.quickAmountButton, { backgroundColor: theme.surfaceSecondary }]}
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
                  style={[styles.confirmButton, { backgroundColor: theme.peach }]}
                  onPress={handleSpendConfirm}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.peach, theme.peachLight]}
                    style={styles.confirmButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.confirmButtonText}>
                      Confirm Spend
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {settingsVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={isKeyboardOffsetEnabled}
          style={[StyleSheet.absoluteFill, { zIndex: 50 }]}
        >
          <Animated.View 
            style={[
              styles.settingsBackdrop, 
              { opacity: settingsOpacity }
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); closeSettings(); }} />
          </Animated.View>
          
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Animated.View 
              style={[
                styles.settingsSheet, 
                { 
                  backgroundColor: theme.surface,
                  transform: [{ translateY: settingsSlide }],
                  maxHeight: SCREEN_HEIGHT * 0.65,
                  position: 'relative',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  flexShrink: 1,
                }
              ]}
            >
              <View style={styles.sheetHandle}>
                <View style={[styles.handleBar, { backgroundColor: theme.textTertiary }]} />
              </View>
              
              <View style={styles.settingsHeader}>
                <View>
                  <Text style={[styles.settingsTitle, { color: theme.text }]}>Settings</Text>
                  <Text style={[styles.settingsTitleSub, { color: theme.textSecondary }]}>Customize your allowance</Text>
                </View>
              </View>

              <ScrollView 
                style={styles.settingsScrollView}
                contentContainerStyle={[styles.settingsContent, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>
                  DAILY ALLOWANCE
                </Text>
                <View style={[styles.settingsInputContainer, { backgroundColor: theme.surfaceSecondary }]}>
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
                  style={[styles.saveButton, { backgroundColor: theme.mint }]}
                  onPress={handleSaveAllowance}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.mint, theme.mintLight]}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.saveButtonText}>
                      Save Changes
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativePattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: SCREEN_WIDTH * 0.75,
  },
  wave1: {
    bottom: -SCREEN_HEIGHT * 0.3,
    left: -SCREEN_WIDTH * 0.2,
  },
  wave2: {
    bottom: -SCREEN_HEIGHT * 0.35,
    right: -SCREEN_WIDTH * 0.3,
  },
  wave3: {
    bottom: -SCREEN_HEIGHT * 0.25,
    left: SCREEN_WIDTH * 0.1,
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
    paddingVertical: 16,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  pixiuContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pixiuGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  pixiuImage: {
    width: 160,
    height: 160,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: 36,
    paddingHorizontal: 24,
  },
  balanceFrame: {
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    minWidth: SCREEN_WIDTH - 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase' as const,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '600' as const,
    marginTop: 6,
    marginRight: 6,
  },
  balanceWhole: {
    fontSize: 64,
    fontWeight: '800' as const,
    letterSpacing: -2,
    lineHeight: 68,
  },
  balanceDecimal: {
    fontSize: 32,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  allowanceBadge: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allowanceText: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  spendButtonWrapper: {
    marginTop: 8,
  },
  spendButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  spendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 56,
    gap: 8,
  },
  spendButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    color: '#FFFFFF',
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
    borderRadius: 32,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  spendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  spendCardTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  spendCardSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 20,
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
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  confirmButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 20,
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
    marginBottom: 4,
  },
  settingsTitleSub: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  settingsKeyboardAvoid: {
    flex: 1,
  },
  settingsScrollView: {
    width: '100%',
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
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  settingsInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600' as const,
  },
  settingsHint: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
