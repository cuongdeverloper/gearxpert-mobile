/**
 * Below are the colors and fonts used in the GearXpert mobile app.
 * Synchronized with the web design system.
 */

import { Platform } from 'react-native';

const primary = '#6366F1';
const primaryDark = '#4F46E5';
const accentCyan = '#22D3EE';
const backgroundDark = '#0F172A';
const backgroundLight = '#F9FAFB';

export const Colors = {
  light: {
    text: '#0F172A',
    background: backgroundLight,
    primary: primary,
    primaryDark: primaryDark,
    accent: accentCyan,
    tint: primary,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: primary,
    glass: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#F1F5F9',
    background: backgroundDark,
    primary: primary,
    primaryDark: primaryDark,
    accent: accentCyan,
    tint: accentCyan,
    icon: '#94A3B8',
    tabIconDefault: '#475569',
    tabIconSelected: accentCyan,
    glass: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
  },
};

export const Fonts = {
  display: 'SpaceGrotesk-Bold',
  sans: 'Inter-Regular',
  sansMedium: 'Inter-Medium',
  sansBold: 'Inter-Bold',
};

