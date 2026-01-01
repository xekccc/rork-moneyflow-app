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
import { Settings, Minus, X, Check, Sparkles } from 'lucide-react-native';
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
        colors={[theme.backgroundGradientStart, theme.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.decorativePattern}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.decorativeCircle,
              {
                left: ((i * 20) % 100) * SCREEN_WIDTH / 100,
                top: ((i * 15) % 80) * SCREEN_HEIGHT / 100,
                backgroundColor: isDark ? 'rgba(244, 208, 63, 0.03)' : 'rgba(212, 175, 55, 0.05)',
                opacity: 0.3 + (i % 3) * 0.2,
              },
            ]}
          />
        ))}
      </View>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sparkles size={18} color={theme.gold} strokeWidth={2} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>财富守护</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Wealth Guardian</Text>
          </View>
          <TouchableOpacity 
            style={[styles.settingsButton, { 
              backgroundColor: isDark ? 'rgba(244, 208, 63, 0.15)' : 'rgba(212, 175, 55, 0.15)',
              borderWidth: 1,
              borderColor: theme.gold,
            }]} 
            onPress={openSettings}
            activeOpacity={0.7}
          >
            <Settings size={20} color={theme.gold} strokeWidth={2} />
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
              backgroundColor: isDark ? 'rgba(244, 208, 63, 0.1)' : 'rgba(212, 175, 55, 0.08)',
              borderColor: theme.gold,
            }]}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                当前余额 · BALANCE
              </Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.currencySymbol, { color: theme.gold }]}>€</Text>
                <Text style={[styles.balanceWhole, { 
                  color: theme.text,
                  textShadowColor: isDark ? 'rgba(244, 208, 63, 0.3)' : 'rgba(212, 175, 55, 0.2)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }]}>{whole}</Text>
                <Text style={[styles.balanceDecimal, { color: theme.textTertiary }]}>.{decimal}</Text>
              </View>
              {todayAllowanceAdded && (
                <View style={[styles.allowanceBadge, { 
                  backgroundColor: isDark ? 'rgba(244, 208, 63, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                  borderColor: theme.gold,
                }]}>
                  <Sparkles size={12} color={theme.gold} strokeWidth={2} />
                  <Text style={[styles.allowanceText, { color: theme.gold }]}>
                    +€{dailyAllowance.toFixed(2)} 今日添加
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Animated.View style={[styles.spendButtonWrapper, { transform: [{ scale: buttonScale }] }]}>
            <Pressable
              style={[styles.spendButton, {
                backgroundColor: theme.red,
                shadowColor: theme.red,
              }]}
              onPress={handleSpendPress}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <LinearGradient
                colors={[theme.red, theme.redLight]}
                style={styles.spendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Minus size={24} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.spendButtonText}>消费 Spend</Text>
              </LinearGradient>
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
                  <View>
                    <Text style={[styles.spendCardTitle, { color: theme.text }]}>
                      输入金额
                    </Text>
                    <Text style={[styles.spendCardSubtitle, { color: theme.textSecondary }]}>
                      Enter Amount
                    </Text>
                  </View>
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
                  style={[styles.confirmButton, { backgroundColor: theme.red }]}
                  onPress={handleSpendConfirm}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.red, theme.redLight]}
                    style={styles.confirmButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.confirmButtonText}>
                      确认消费 · Confirm
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
                  <Text style={[styles.settingsTitle, { color: theme.text }]}>设置</Text>
                  <Text style={[styles.settingsTitleSub, { color: theme.textSecondary }]}>Settings</Text>
                </View>
              </View>

              <ScrollView 
                style={styles.settingsScrollView}
                contentContainerStyle={[styles.settingsContent, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>
                  每日额度 · DAILY ALLOWANCE
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
                  此金额将在每天午夜添加到您的余额中。
                </Text>
                <Text style={[styles.settingsHintEn, { color: theme.textTertiary }]}>
                  This amount will be added at midnight each day.
                </Text>

                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.gold }]}
                  onPress={handleSaveAllowance}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.gold, theme.goldLight]}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.saveButtonText}>
                      保存更改 · Save
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
  decorativeCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
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
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
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
    borderWidth: 2,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    minWidth: SCREEN_WIDTH - 80,
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
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allowanceText: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  spendButtonWrapper: {
    marginTop: 8,
  },
  spendButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  spendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    gap: 10,
  },
  spendButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
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
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  spendCardSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
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
    borderRadius: 16,
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
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 6,
  },
  settingsHintEn: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 28,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#2C1810',
  },
});
