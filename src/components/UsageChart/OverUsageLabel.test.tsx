import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverUsageLabel } from './OverUsageLabel';

describe('OverUsageLabel', () => {
  it('should return null when value is 0', () => {
    const { container } = render(
      <svg>
        <OverUsageLabel x={0} y={0} width={100} height={20} value={0} />
      </svg>
    );
    
    expect(container.querySelector('text')).not.toBeInTheDocument();
  });

  it('should return null when value is undefined', () => {
    const { container } = render(
      <svg>
        <OverUsageLabel x={0} y={0} width={100} height={20} value={undefined} />
      </svg>
    );
    
    expect(container.querySelector('text')).not.toBeInTheDocument();
  });

  it('should render text with value when provided', () => {
    render(
      <svg>
        <OverUsageLabel x={0} y={0} width={100} height={20} value={25} />
      </svg>
    );
    
    expect(screen.getByText('25 GB')).toBeInTheDocument();
  });

  it('should position inside (end anchor) for wide bars', () => {
    const { container } = render(
      <svg>
        <OverUsageLabel x={0} y={0} width={100} height={20} value={25} />
      </svg>
    );
    
    const text = container.querySelector('text');
    expect(text?.getAttribute('text-anchor')).toBe('end');
    // x should be width - 10 = 90
    expect(text?.getAttribute('x')).toBe('90');
  });

  it('should position outside (start anchor) for narrow bars', () => {
    const { container } = render(
      <svg>
        <OverUsageLabel x={0} y={0} width={30} height={20} value={25} />
      </svg>
    );
    
    const text = container.querySelector('text');
    expect(text?.getAttribute('text-anchor')).toBe('start');
    // x should be width + 8 = 38
    expect(text?.getAttribute('x')).toBe('38');
  });

  it('should vertically center the text', () => {
    const { container } = render(
      <svg>
        <OverUsageLabel x={0} y={10} width={100} height={20} value={25} />
      </svg>
    );
    
    const text = container.querySelector('text');
    // y should be y + height/2 = 10 + 10 = 20
    expect(text?.getAttribute('y')).toBe('20');
    expect(text?.getAttribute('dominant-baseline')).toBe('middle');
  });

  it('should use correct styling', () => {
    const { container } = render(
      <svg>
        <OverUsageLabel x={0} y={0} width={100} height={20} value={25} />
      </svg>
    );
    
    const text = container.querySelector('text');
    expect(text?.getAttribute('fill')).toBe('hsl(var(--foreground))');
    expect(text?.getAttribute('font-size')).toBe('11');
    expect(text?.getAttribute('font-weight')).toBe('700');
  });

  it('should handle edge case width of exactly 45', () => {
    const { container } = render(
      <svg>
        <OverUsageLabel x={0} y={0} width={45} height={20} value={25} />
      </svg>
    );
    
    const text = container.querySelector('text');
    // 45 is not < 45, so should be inside positioning
    expect(text?.getAttribute('text-anchor')).toBe('end');
  });
});
