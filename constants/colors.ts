export const colors = {
  light: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceSecondary: 'rgba(255, 255, 255, 0.8)',
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#AEAEB2',
    accent: '#007AFF',
    accentSecondary: '#5856D6',
    success: '#34C759',
    destructive: '#FF3B30',
    separator: 'rgba(60, 60, 67, 0.12)',
    coinPrimary: '#FFD60A',
    coinSecondary: '#FF9F0A',
    coinHighlight: '#FFFACD',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSecondary: 'rgba(28, 28, 30, 0.8)',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    accent: '#0A84FF',
    accentSecondary: '#5E5CE6',
    success: '#30D158',
    destructive: '#FF453A',
    separator: 'rgba(84, 84, 88, 0.65)',
    coinPrimary: '#FFD60A',
    coinSecondary: '#FF9F0A',
    coinHighlight: '#FFFACD',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

export type ColorScheme = keyof typeof colors;
export type Colors = typeof colors.light;
