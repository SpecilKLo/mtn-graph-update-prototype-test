import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChartTooltip } from './ChartTooltip';

describe('ChartTooltip', () => {
  const mockPayload = [
    {
      payload: {
        label: '15',
        date: new Date(2024, 0, 15),
        usage: 123.456,
        overUsage: 25,
      },
    },
  ];

  it('should return null when not active', () => {
    const { container } = render(
      <ChartTooltip active={false} payload={mockPayload} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should return null when payload is empty', () => {
    const { container } = render(
      <ChartTooltip active={true} payload={[]} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should return null when payload is undefined', () => {
    const { container } = render(
      <ChartTooltip active={true} payload={undefined} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render tooltip when active with payload', () => {
    const { getByText } = render(<ChartTooltip active={true} payload={mockPayload} />);
    
    expect(getByText('Usage:')).toBeInTheDocument();
    expect(getByText('123.46 GB')).toBeInTheDocument();
  });

  it('should display over usage when present', () => {
    const { getByText } = render(<ChartTooltip active={true} payload={mockPayload} />);
    
    expect(getByText('Over Usage:')).toBeInTheDocument();
    expect(getByText('25 GB')).toBeInTheDocument();
  });

  it('should not display over usage when not present', () => {
    const payloadWithoutOverUsage = [
      {
        payload: {
          label: '15',
          date: new Date(2024, 0, 15),
          usage: 100,
        },
      },
    ];
    
    const { queryByText } = render(<ChartTooltip active={true} payload={payloadWithoutOverUsage} />);
    
    expect(queryByText('Over Usage:')).not.toBeInTheDocument();
  });

  it('should display dateRange when available', () => {
    const payloadWithDateRange = [
      {
        payload: {
          label: 'Jan 1',
          date: new Date(2024, 0, 1),
          dateRange: 'Jan 1 - Jan 7',
          usage: 100,
        },
      },
    ];
    
    const { getByText } = render(<ChartTooltip active={true} payload={payloadWithDateRange} />);
    
    expect(getByText('Jan 1 - Jan 7')).toBeInTheDocument();
  });

  it('should format date when dateRange is not available', () => {
    const { getByText } = render(<ChartTooltip active={true} payload={mockPayload} />);
    
    // date-fns "PP" format for Jan 15, 2024 
    expect(getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('should handle zero usage', () => {
    const payloadWithZeroUsage = [
      {
        payload: {
          label: '1',
          date: new Date(2024, 0, 1),
          usage: 0,
        },
      },
    ];
    
    const { getByText } = render(<ChartTooltip active={true} payload={payloadWithZeroUsage} />);
    
    expect(getByText('0.00 GB')).toBeInTheDocument();
  });
});
