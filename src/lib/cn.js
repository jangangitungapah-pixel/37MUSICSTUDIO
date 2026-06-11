export function cn(...classes) {
  return classes
    .flatMap((item) => {
      if (!item) return [];
      if (Array.isArray(item)) return item;
      return [item];
    })
    .filter(Boolean)
    .join(' ');
}
