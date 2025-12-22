// Chart layout constants
export const CHART_CONFIG = {
  Y_AXIS_WIDTH: 60,
  RIGHT_MARGIN: 40,
  LEFT_MARGIN: 0,
  HEADER_HEIGHT: 72,
  FOOTER_HEIGHT: 64,
  X_AXIS_HEIGHT: 40,
} as const;

// Dynamic bar sizing configuration
export const BAR_SIZE_CONFIG = {
  ESTIMATED_CONTAINER_HEIGHT: 450,
  TARGET_FILL_RATIO: 0.65,
  MIN_BAR_HEIGHT: 35,
  MAX_BAR_HEIGHT: 140,
  MIN_BAR_SIZE: 24,
  MAX_BAR_SIZE: 100,
  BAR_SIZE_RATIO: 0.7, // Bar size as ratio of row height
  PADDING: 25,
} as const;

// Animation durations
export const ANIMATION_CONFIG = {
  BAR_DURATION: 800,
  DEBOUNCE: 50,
} as const;
