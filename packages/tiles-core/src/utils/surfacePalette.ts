import { surfaceColor } from './colorUtils';

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

