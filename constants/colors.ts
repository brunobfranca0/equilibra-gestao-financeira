export const COLORS_DARK = {
  background: '#0F0F10',
  card: '#1A1A1C',
  cardAlt: '#151517',
  purple: '#A259FF',
  green: '#31D158',
  red: '#FF4D4F',
  gray: '#6A6A70',
  white: '#FFFFFF',
  black: '#000000',
  border: '#242428',
  text: '#FFFFFF',
  textSecondary: '#6A6A70',
  inputBackground: '#151517',
};

export const COLORS_LIGHT = {
  background: '#F5F5F7',
  card: '#FFFFFF',
  cardAlt: '#EEEEF0',
  purple: '#A259FF',
  green: '#31D158',
  red: '#FF4D4F',
  gray: '#8E8E93',
  white: '#FFFFFF',
  black: '#000000',
  border: '#E5E5EA',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  inputBackground: '#EEEEF0',
};

// Manter compatibilidade com código existente (tema escuro como padrão)
export const COLORS = COLORS_DARK;

export type ThemeColors = typeof COLORS_DARK;