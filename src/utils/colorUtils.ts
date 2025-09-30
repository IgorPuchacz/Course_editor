import { useMemo } from 'react';

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex) return null;

  let normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    normalized = normalized.split('').map((char) => `${char}${char}`).join('');
  }

  if (normalized.length !== 6) return null;

  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) return null;

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
};

export const channelToLinear = (value: number): number => {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
};

export const getReadableTextColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#0f172a';

  const luminance = (0.2126 * channelToLinear(rgb.r)) +
    (0.7152 * channelToLinear(rgb.g)) +
    (0.0722 * channelToLinear(rgb.b));

  return luminance > 0.6 ? '#0f172a' : '#f8fafc';
};

export const lightenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const lightenChannel = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${lightenChannel(rgb.r)}, ${lightenChannel(rgb.g)}, ${lightenChannel(rgb.b)})`;
};

export const darkenColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const darkenChannel = (channel: number) => Math.round(channel * (1 - amount));
  return `rgb(${darkenChannel(rgb.r)}, ${darkenChannel(rgb.g)}, ${darkenChannel(rgb.b)})`;
};

export const surfaceColor = (accent: string, textColor: string, lightenAmount: number, darkenAmount: number): string =>
  textColor === '#0f172a' ? lightenColor(accent, lightenAmount) : darkenColor(accent, darkenAmount);

export interface SharedAccentPalette {
  panelBackground: string;
  panelBorder: string;
  iconBackground: string;
  testingCaptionColor: string;
}

export interface ButtonPalette {
  primary: {
    background: string;
    text: string;
  };
  secondary: {
    background: string;
    border: string;
  };
}

export interface FeedbackPalette {
  successBackground: string;
  successBorder: string;
  failureBackground: string;
  failureBorder: string;
}

export interface QuizAccentPalette {
  panelBackground: string;
  panelBorder: string;
  iconBackground: string;
  answerBackground: string;
  answerBorder: string;
  answerSelectedBackground: string;
  answerSelectedBorder: string;
}

export interface SequencingAccentPalette {
  gradientStart: string;
  gradientEnd: string;
  frameBorderColor: string;
  panelBackground: string;
  panelBorder: string;
  iconBackground: string;
  poolBackground: string;
  poolBorder: string;
  poolHighlightBackground: string;
  poolHighlightBorder: string;
  itemBackground: string;
  itemBorder: string;
  gripBackground: string;
  gripBorder: string;
  sequenceBackground: string;
  sequenceBorder: string;
  sequenceHeaderBorder: string;
  badgeBackground: string;
  badgeBorder: string;
  slotEmptyBackground: string;
  slotEmptyBorder: string;
  slotHoverBackground: string;
  slotHoverBorder: string;
  slotFilledBackground: string;
  slotFilledBorder: string;
  slotCorrectBackground: string;
  slotCorrectBorder: string;
  successIconColor: string;
}

export interface MatchPairsAccentPalette {
  panelBackground: string;
  panelBorder: string;
  iconBackground: string;
  blankBackground: string;
  blankBorder: string;
  blankHoverBackground: string;
  blankFilledBackground: string;
  optionBackground: string;
  optionBorder: string;
}

export interface AccentPalette {
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  shared: SharedAccentPalette;
  buttons: ButtonPalette;
  feedback: FeedbackPalette;
  quiz: QuizAccentPalette;
  sequencing: SequencingAccentPalette;
  matchPairs: MatchPairsAccentPalette;
}

export const buildAccentPalette = (accentColor: string, providedTextColor?: string): AccentPalette => {
  const textColor = providedTextColor ?? getReadableTextColor(accentColor);
  const surface = (lightenAmount: number, darkenAmount: number) =>
    surfaceColor(accentColor, textColor, lightenAmount, darkenAmount);
  const lighten = (amount: number) => lightenColor(accentColor, amount);
  const darken = (amount: number) => darkenColor(accentColor, amount);

  const sharedPanelBackground = surface(0.62, 0.45);
  const sharedPanelBorder = surface(0.5, 0.55);
  const sharedIconBackground = surface(0.54, 0.48);
  const testingCaptionColor = surface(0.42, 0.4);

  return {
    accentColor,
    textColor,
    mutedTextColor: textColor === '#0f172a' ? '#475569' : '#e2e8f0',
    shared: {
      panelBackground: sharedPanelBackground,
      panelBorder: sharedPanelBorder,
      iconBackground: sharedIconBackground,
      testingCaptionColor,
    },
    buttons: {
      primary: {
        background: textColor === '#0f172a' ? darken(0.25) : lighten(0.28),
        text: textColor === '#0f172a' ? '#f8fafc' : '#0f172a',
      },
      secondary: {
        background: surface(0.52, 0.5),
        border: surface(0.46, 0.58),
      },
    },
    feedback: {
      successBackground: surface(0.7, 0.34),
      successBorder: surface(0.6, 0.44),
      failureBackground: '#fee2e2',
      failureBorder: '#fca5a5',
    },
    quiz: {
      panelBackground: surface(0.66, 0.42),
      panelBorder: surface(0.54, 0.52),
      iconBackground: surface(0.58, 0.48),
      answerBackground: surface(0.7, 0.38),
      answerBorder: surface(0.58, 0.48),
      answerSelectedBackground: surface(0.46, 0.56),
      answerSelectedBorder: surface(0.38, 0.62),
    },
    sequencing: {
      gradientStart: lighten(0.08),
      gradientEnd: darken(0.08),
      frameBorderColor: surface(0.52, 0.6),
      panelBackground: surface(0.64, 0.45),
      panelBorder: surface(0.5, 0.58),
      iconBackground: surface(0.56, 0.5),
      poolBackground: surface(0.6, 0.4),
      poolBorder: surface(0.5, 0.56),
      poolHighlightBackground: surface(0.7, 0.3),
      poolHighlightBorder: surface(0.6, 0.45),
      itemBackground: surface(0.52, 0.46),
      itemBorder: surface(0.42, 0.58),
      gripBackground: surface(0.48, 0.52),
      gripBorder: surface(0.42, 0.6),
      sequenceBackground: surface(0.58, 0.42),
      sequenceBorder: surface(0.48, 0.6),
      sequenceHeaderBorder: surface(0.44, 0.64),
      badgeBackground: surface(0.54, 0.48),
      badgeBorder: surface(0.46, 0.58),
      slotEmptyBackground: surface(0.58, 0.42),
      slotEmptyBorder: surface(0.5, 0.58),
      slotHoverBackground: surface(0.68, 0.32),
      slotHoverBorder: surface(0.58, 0.5),
      slotFilledBackground: surface(0.48, 0.5),
      slotFilledBorder: surface(0.42, 0.6),
      slotCorrectBackground: surface(0.72, 0.26),
      slotCorrectBorder: surface(0.62, 0.36),
      successIconColor: textColor === '#0f172a' ? darken(0.2) : lighten(0.32),
    },
    matchPairs: {
      panelBackground: sharedPanelBackground,
      panelBorder: sharedPanelBorder,
      iconBackground: sharedIconBackground,
      blankBackground: surface(0.65, 0.38),
      blankBorder: surface(0.54, 0.52),
      blankHoverBackground: surface(0.75, 0.32),
      blankFilledBackground: surface(0.52, 0.46),
      optionBackground: surface(0.52, 0.46),
      optionBorder: surface(0.44, 0.56),
    },
  };
};

export const useTileAccentPalette = (accentColor: string, providedTextColor?: string): AccentPalette =>
  useMemo(() => buildAccentPalette(accentColor, providedTextColor), [accentColor, providedTextColor]);
