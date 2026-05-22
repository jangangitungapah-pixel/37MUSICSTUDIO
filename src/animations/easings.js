/**
 * Premium easing curves for modern, high-end web applications.
 * Use these instead of standard linear or ease-in-out for a more polished feel.
 */

export const easings = {
  // Smooth, elegant entrance (great for general elements)
  smooth: [0.4, 0, 0.2, 1],
  
  // Fast acceleration, gentle deceleration (great for clicks/taps)
  snappy: [0.175, 0.885, 0.32, 1.275],
  
  // Slow start, fast end, then slow stop (great for dramatic reveals)
  elegant: [0.85, 0, 0.15, 1],
  
  // Bouncy but not too exaggerated (great for modals/popups)
  softSpring: [0.2, 0.8, 0.2, 1.2],
  
  // Very subtle bounce
  bounceSoft: [0.34, 1.56, 0.64, 1],
  
  // High-end cinematic feel (slow, sustained, then sharp finish)
  cinematic: [0.6, 0.01, 0.05, 0.95],

  // Exits quickly, enters slowly
  expoOut: [0.16, 1, 0.3, 1],
  
  // Slightly backs up before moving forward
  backOut: [0.34, 1.56, 0.64, 1],
};
