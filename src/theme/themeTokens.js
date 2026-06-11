export const themeModes = ['dark', 'light'];

export const densityModes = ['comfortable', 'compact'];

export const containerSizes = {
  page: 'max-w-[1180px]',
  narrow: 'max-w-[920px]',
  reading: 'max-w-[760px]',
};

export const themeMeta = {
  appName: '37 Music Studio',
  themeName: 'Tailwind Studio Container Theme',
  version: '0.2.0',
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
