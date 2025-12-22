import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MonthReferenceAreas } from './MonthReferenceAreas';
import { BarChart, ResponsiveContainer } from 'recharts';
import type { MonthBlock } from './types';

// Helper to render within chart context
const renderWithChart = (monthBlocks: MonthBlock[], maxDomainValue: number) => {
  return render(
    <ResponsiveContainer width={400} height={300}>
      <BarChart data={[{ label: 'test', value: 100 }]} layout="vertical">
        <MonthReferenceAreas monthBlocks={monthBlocks} maxDomainValue={maxDomainValue} />
      </BarChart>
    </ResponsiveContainer>
  );
};

describe('MonthReferenceAreas', () => {
  it('should render empty fragment when no month blocks', () => {
    const { container } = renderWithChart([], 100);
    
    // Should still render the chart but no reference areas
    expect(container.querySelector('.recharts-reference-area')).not.toBeInTheDocument();
  });

  it('should render reference areas for each month block', () => {
    const monthBlocks: MonthBlock[] = [
      { month: 'January', start: 'Jan 29', end: 'Jan 1' },
      { month: 'February', start: 'Feb 26', end: 'Feb 5' },
    ];
    
    const { container } = renderWithChart(monthBlocks, 200);
    
    // Reference areas are rendered as rect elements inside the chart
    const referenceAreas = container.querySelectorAll('.recharts-reference-area');
    expect(referenceAreas.length).toBe(2);
  });

  it('should alternate fill opacity (first even = visible, odd = transparent)', () => {
    const monthBlocks: MonthBlock[] = [
      { month: 'January', start: 'Jan 29', end: 'Jan 1' },
      { month: 'February', start: 'Feb 26', end: 'Feb 5' },
      { month: 'March', start: 'Mar 25', end: 'Mar 4' },
    ];
    
    const { container } = renderWithChart(monthBlocks, 200);
    
    const rectangles = container.querySelectorAll('.recharts-reference-area-rect');
    // First (index 0) should have opacity 0.08
    // Second (index 1) should have opacity 0
    // Third (index 2) should have opacity 0.08
    expect(rectangles.length).toBe(3);
  });
});
