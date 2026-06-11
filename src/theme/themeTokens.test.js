import { describe, expect, it } from 'vitest';
import {
  containerSizes,
  getSafeDensityMode,
  getSafeThemeMode,
  isDensityMode,
  isThemeMode,
  themeMeta,
} from './themeTokens.js';

describe('theme tokens', () => {
  it('validates supported theme modes', () => {
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('neon')).toBe(false);
  });

  it('returns safe theme fallback', () => {
    expect(getSafeThemeMode('light')).toBe('light');
    expect(getSafeThemeMode('unknown')).toBe('dark');
  });

  it('validates supported density modes', () => {
    expect(isDensityMode('comfortable')).toBe(true);
    expect(isDensityMode('compact')).toBe(true);
    expect(isDensityMode('tiny')).toBe(false);
  });

  it('returns safe density fallback', () => {
    expect(getSafeDensityMode('compact')).toBe('compact');
    expect(getSafeDensityMode('tiny')).toBe('comfortable');
  });

  it('exposes Tailwind-oriented theme metadata and container sizes', () => {
    expect(themeMeta.appName).toBe('37 Music Studio');
    expect(themeMeta.themeName).toContain('Tailwind');
    expect(containerSizes.page).toContain('1180px');
  });
});
