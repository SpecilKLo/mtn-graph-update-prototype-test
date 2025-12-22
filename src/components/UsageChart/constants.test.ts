import { describe, it, expect } from 'vitest';
import { CHART_CONFIG, BAR_SIZE_CONFIG, ANIMATION_CONFIG } from './constants';

describe('CHART_CONFIG', () => {
  it('should have valid Y_AXIS_WIDTH', () => {
    expect(CHART_CONFIG.Y_AXIS_WIDTH).toBeGreaterThan(0);
    expect(typeof CHART_CONFIG.Y_AXIS_WIDTH).toBe('number');
  });

  it('should have valid margins', () => {
    expect(CHART_CONFIG.RIGHT_MARGIN).toBeGreaterThanOrEqual(0);
    expect(CHART_CONFIG.LEFT_MARGIN).toBeGreaterThanOrEqual(0);
  });

  it('should have valid heights', () => {
    expect(CHART_CONFIG.HEADER_HEIGHT).toBeGreaterThan(0);
    expect(CHART_CONFIG.FOOTER_HEIGHT).toBeGreaterThan(0);
    expect(CHART_CONFIG.X_AXIS_HEIGHT).toBeGreaterThan(0);
  });

  it('should be immutable (as const)', () => {
    expect(Object.isFrozen(CHART_CONFIG)).toBe(true);
  });
});

describe('BAR_SIZE_CONFIG', () => {
  it('should have valid container height estimate', () => {
    expect(BAR_SIZE_CONFIG.ESTIMATED_CONTAINER_HEIGHT).toBeGreaterThan(0);
  });

  it('should have fill ratio between 0 and 1', () => {
    expect(BAR_SIZE_CONFIG.TARGET_FILL_RATIO).toBeGreaterThan(0);
    expect(BAR_SIZE_CONFIG.TARGET_FILL_RATIO).toBeLessThanOrEqual(1);
  });

  it('should have min bar height less than max', () => {
    expect(BAR_SIZE_CONFIG.MIN_BAR_HEIGHT).toBeLessThan(BAR_SIZE_CONFIG.MAX_BAR_HEIGHT);
  });

  it('should have min bar size less than max', () => {
    expect(BAR_SIZE_CONFIG.MIN_BAR_SIZE).toBeLessThan(BAR_SIZE_CONFIG.MAX_BAR_SIZE);
  });

  it('should have bar size ratio between 0 and 1', () => {
    expect(BAR_SIZE_CONFIG.BAR_SIZE_RATIO).toBeGreaterThan(0);
    expect(BAR_SIZE_CONFIG.BAR_SIZE_RATIO).toBeLessThanOrEqual(1);
  });

  it('should have positive padding', () => {
    expect(BAR_SIZE_CONFIG.PADDING).toBeGreaterThanOrEqual(0);
  });

  it('should be immutable (as const)', () => {
    expect(Object.isFrozen(BAR_SIZE_CONFIG)).toBe(true);
  });
});

describe('ANIMATION_CONFIG', () => {
  it('should have valid bar animation duration', () => {
    expect(ANIMATION_CONFIG.BAR_DURATION).toBeGreaterThan(0);
    expect(ANIMATION_CONFIG.BAR_DURATION).toBeLessThanOrEqual(2000); // Reasonable max
  });

  it('should have valid debounce value', () => {
    expect(ANIMATION_CONFIG.DEBOUNCE).toBeGreaterThanOrEqual(0);
    expect(ANIMATION_CONFIG.DEBOUNCE).toBeLessThanOrEqual(500); // Reasonable max
  });

  it('should be immutable (as const)', () => {
    expect(Object.isFrozen(ANIMATION_CONFIG)).toBe(true);
  });
});
