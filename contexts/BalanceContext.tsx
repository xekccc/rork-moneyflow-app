import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEYS = {
  BALANCE: 'enough_balance',
  DAILY_ALLOWANCE: 'enough_daily_allowance',
  LAST_ALLOWANCE_DATE: 'enough_last_allowance_date',
};

export interface BalanceData {
  balance: number;
  dailyAllowance: number;
  isLoading: boolean;
  todayAllowanceAdded: boolean;
  spend: (amount: number) => void;
  setDailyAllowance: (amount: number) => void;
}

export const [BalanceProvider, useBalance] = createContextHook(() => {
  const [balance, setBalance] = useState<number>(0);
  const [dailyAllowance, setDailyAllowanceState] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todayAllowanceAdded, setTodayAllowanceAdded] = useState<boolean>(false);

  const getTodayDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  };

  const loadData = async () => {
    try {
      console.log('[BalanceContext] Loading data from storage...');
      const [storedBalance, storedAllowance, lastDate] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BALANCE),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_ALLOWANCE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_ALLOWANCE_DATE),
      ]);

      const currentBalance = storedBalance ? parseFloat(storedBalance) : 0;
      const currentAllowance = storedAllowance ? parseFloat(storedAllowance) : 10;
      const todayDate = getTodayDateString();

      console.log('[BalanceContext] Stored balance:', currentBalance);
      console.log('[BalanceContext] Daily allowance:', currentAllowance);
      console.log('[BalanceContext] Last allowance date:', lastDate);
      console.log('[BalanceContext] Today date:', todayDate);

      setDailyAllowanceState(currentAllowance);

      if (lastDate !== todayDate) {
        console.log('[BalanceContext] New day detected! Adding daily allowance');
        const newBalance = currentBalance + currentAllowance;
        setBalance(newBalance);
        setTodayAllowanceAdded(true);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.BALANCE, newBalance.toString()],
          [STORAGE_KEYS.LAST_ALLOWANCE_DATE, todayDate],
        ]);
      } else {
        console.log('[BalanceContext] Same day, loading existing balance');
        setBalance(currentBalance);
        setTodayAllowanceAdded(true);
      }
    } catch (error) {
      console.error('[BalanceContext] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spend = async (amount: number) => {
    if (amount <= 0) {
      console.warn('[BalanceContext] Invalid spend amount:', amount);
      return;
    }

    const newBalance = balance - amount;
    console.log('[BalanceContext] Spending:', amount, 'New balance:', newBalance);
    setBalance(newBalance);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BALANCE, newBalance.toString());
    } catch (error) {
      console.error('[BalanceContext] Error saving balance:', error);
    }
  };

  const setDailyAllowance = async (amount: number) => {
    if (amount <= 0) {
      console.warn('[BalanceContext] Invalid allowance amount:', amount);
      return;
    }

    console.log('[BalanceContext] Setting daily allowance:', amount);
    setDailyAllowanceState(amount);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_ALLOWANCE, amount.toString());
    } catch (error) {
      console.error('[BalanceContext] Error saving allowance:', error);
    }
  };

  return {
    balance,
    dailyAllowance,
    isLoading,
    todayAllowanceAdded,
    spend,
    setDailyAllowance,
  };
});
