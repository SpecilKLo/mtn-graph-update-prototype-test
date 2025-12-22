import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartFooter } from './ChartFooter';

describe('ChartFooter', () => {
  it('should render total usage with correct formatting', () => {
    render(<ChartFooter totalUsage={123.456} />);
    
    expect(screen.getByText('123.46 GB')).toBeInTheDocument();
  });

  it('should render legend items', () => {
    render(<ChartFooter totalUsage={100} />);
    
    expect(screen.getByText('Regular Usage')).toBeInTheDocument();
    expect(screen.getByText('Over Usage')).toBeInTheDocument();
  });

  it('should render timezone indicator', () => {
    render(<ChartFooter totalUsage={100} />);
    
    expect(screen.getByText('UTC-0 Timezone')).toBeInTheDocument();
  });

  it('should render total usage label', () => {
    render(<ChartFooter totalUsage={100} />);
    
    expect(screen.getByText('Total Usage:')).toBeInTheDocument();
  });

  it('should handle zero total usage', () => {
    render(<ChartFooter totalUsage={0} />);
    
    expect(screen.getByText('0.00 GB')).toBeInTheDocument();
  });

  it('should handle large total usage values', () => {
    render(<ChartFooter totalUsage={9999.99} />);
    
    expect(screen.getByText('9999.99 GB')).toBeInTheDocument();
  });

  it('should render legend color indicators', () => {
    const { container } = render(<ChartFooter totalUsage={100} />);
    
    // Check for colored dot elements
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(2);
  });
});
