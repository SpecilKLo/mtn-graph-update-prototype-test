import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChartFooter } from './ChartFooter';

describe('ChartFooter', () => {
  it('should render total usage with correct formatting', () => {
    const { getByText } = render(<ChartFooter totalUsage={123.456} />);
    
    expect(getByText('123.46 GB')).toBeInTheDocument();
  });

  it('should render legend items', () => {
    const { getByText } = render(<ChartFooter totalUsage={100} />);
    
    expect(getByText('Regular Usage')).toBeInTheDocument();
    expect(getByText('Over Usage')).toBeInTheDocument();
  });

  it('should render timezone indicator', () => {
    const { getByText } = render(<ChartFooter totalUsage={100} />);
    
    expect(getByText('UTC-0 Timezone')).toBeInTheDocument();
  });

  it('should render total usage label', () => {
    const { getByText } = render(<ChartFooter totalUsage={100} />);
    
    expect(getByText('Total Usage:')).toBeInTheDocument();
  });

  it('should handle zero total usage', () => {
    const { getByText } = render(<ChartFooter totalUsage={0} />);
    
    expect(getByText('0.00 GB')).toBeInTheDocument();
  });

  it('should handle large total usage values', () => {
    const { getByText } = render(<ChartFooter totalUsage={9999.99} />);
    
    expect(getByText('9999.99 GB')).toBeInTheDocument();
  });

  it('should render legend color indicators', () => {
    const { container } = render(<ChartFooter totalUsage={100} />);
    
    // Check for colored dot elements
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(2);
  });
});
