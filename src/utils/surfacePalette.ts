import { surfaceColor, lightenColor, darkenColor } from './colorUtils';
import {
  ValidateButtonColors,
  ValidateButtonState,
  ValidateButtonColorConfig
} from 'tiles-core';

export interface SurfaceColorDefinition {
  lighten: number;
  darken: number;
}

export type SurfaceColorConfig<T extends string> = Record<T, SurfaceColorDefinition>;

export const createSurfacePalette = <T extends string>(
  accentColor: string,
  textColor: string,
  config: SurfaceColorConfig<T>
): Record<T, string> => {
  return (Object.keys(config) as T[]).reduce((palette, key) => {
    const { lighten, darken } = config[key];
    palette[key] = surfaceColor(accentColor, textColor, lighten, darken);
    return palette;
  }, {} as Record<T, string>);
};

const BUTTON_STATES: ValidateButtonState[] = ['idle', 'success', 'error'];

const BASE_SUCCESS: ValidateButtonColorConfig = {
  background: '#dcfce7',
  color: '#166534',
  border: '#bbf7d0'
};

const BASE_ERROR: ValidateButtonColorConfig = {
  background: '#fee2e2',
  color: '#b91c1c',
  border: '#fecaca'
};

export const createValidateButtonPalette = (
  accentColor: string,
  textColor: string,
  overrides?: ValidateButtonColors
): ValidateButtonColors => {
  const baseIdle: ValidateButtonColorConfig = {
    background:
      textColor === '#0f172a'
        ? darkenColor(accentColor, 0.2)
        : lightenColor(accentColor, 0.24),
    color: textColor === '#0f172a' ? '#f8fafc' : '#0f172a',
    border: 'transparent'
  };

  const base: Record<ValidateButtonState, ValidateButtonColorConfig> = {
    idle: baseIdle,
    success: BASE_SUCCESS,
    error: BASE_ERROR
  };

  return BUTTON_STATES.reduce<ValidateButtonColors>((acc, state) => {
    const override = overrides?.[state];
    acc[state] = override ? { ...base[state], ...override } : base[state];
    return acc;
  }, {} as ValidateButtonColors);
};
