import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UsageBarShape } from './UsageBarShape';

describe('UsageBarShape', () => {
  it('should render a path element', () => {
    const { container } = render(
      <svg>
        <UsageBarShape x={0} y={0} width={100} height={20} />
      </svg>
    );
    
    expect(container.querySelector('path')).toBeInTheDocument();
  });

  it('should have rounded corners when no overUsage', () => {
    const { container } = render(
      <svg>
        <UsageBarShape x={0} y={0} width={100} height={20} payload={{ overUsage: 0 }} />
      </svg>
    );
    
    const path = container.querySelector('path');
    // Path should contain Q commands for rounded corners (radius = 4)
    expect(path?.getAttribute('d')).toContain('Q');
  });

  it('should have no rounded corners when overUsage exists', () => {
    const { container } = render(
      <svg>
        <UsageBarShape x={0} y={0} width={100} height={20} payload={{ overUsage: 10 }} />
      </svg>
    );
    
    const path = container.querySelector('path');
    const d = path?.getAttribute('d') || '';
    // When radius is 0, the Q commands still exist but effectively create straight lines
    // Check that width-0 = width in the path
    expect(d).toContain('L100,0');
  });

  it('should use correct fill color', () => {
    const { container } = render(
      <svg>
        <UsageBarShape x={0} y={0} width={100} height={20} />
      </svg>
    );
    
    const path = container.querySelector('path');
    expect(path?.getAttribute('fill')).toBe('hsl(var(--chart-2))');
  });

  it('should handle undefined props gracefully', () => {
    const { container } = render(
      <svg>
        <UsageBarShape />
      </svg>
    );
    
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('should position correctly based on x and y props', () => {
    const { container } = render(
      <svg>
        <UsageBarShape x={50} y={100} width={80} height={25} />
      </svg>
    );
    
    const path = container.querySelector('path');
    const d = path?.getAttribute('d') || '';
    // Should start at M50,100
    expect(d).toContain('M50,100');
  });
});
