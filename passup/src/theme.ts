export const colors = {
  bg: '#050a16',
  bgElevated: '#0a1224',
  surface: '#0d162c',
  surfaceAlt: '#111c36',
  surfaceMuted: '#0a1328',
  border: '#1a2b4d',
  borderStrong: '#27406f',
  text: '#f8fafc',
  textSecondary: '#d5deeb',
  textMuted: '#8fa0b8',
  textDim: '#5f708a',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primarySoft: 'rgba(59,130,246,0.16)',
  accent: '#7dd3fc',
  success: '#34d399',
  successSoft: 'rgba(16,185,129,0.14)',
  warning: '#fbbf24',
  warningSoft: 'rgba(251,191,36,0.14)',
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.14)',
  dangerBorder: '#7f1d1d',
  dangerBg: '#450a0a',
  overlay: 'rgba(2,6,18,0.82)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const typography = {
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  section: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    lineHeight: 14,
  },
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
};
