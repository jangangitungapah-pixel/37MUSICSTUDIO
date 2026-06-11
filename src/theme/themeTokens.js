export const themeModes = ['dark', 'light'];

export const densityModes = ['comfortable', 'compact'];

export const containerSizes = {
  page: 'min(1180px, calc(100vw - 32px))',
  narrow: 'min(920px, calc(100vw - 32px))',
  reading: 'min(760px, calc(100vw - 32px))',
};

export const themeMeta = {
  appName: '37 Music Studio',
  themeName: 'Studio Container Theme',
  version: '0.1.0',
};

export function isThemeMode(value) {
  return themeModes.includes(value);
}

export function getSafeThemeMode(value, fallback = 'dark') {
  return isThemeMode(value) ? value : fallback;
}

export function isDensityMode(value) {
  return densityModes.includes(value);
}

export function getSafeDensityMode(value, fallback = 'comfortable') {
  return isDensityMode(value) ? value : fallback;
}
