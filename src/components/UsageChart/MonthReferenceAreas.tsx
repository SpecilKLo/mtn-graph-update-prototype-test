import { ReferenceArea } from "recharts";
import type { MonthBlock } from "./types";

interface MonthReferenceAreasProps {
  monthBlocks: MonthBlock[];
  maxDomainValue: number;
}

/**
 * Renders alternating reference areas to highlight month boundaries
 * in the weekly view. Adds month labels at the top-right of each area.
 */
export const MonthReferenceAreas = ({ monthBlocks, maxDomainValue }: MonthReferenceAreasProps) => {
  return (
    <>
      {monthBlocks.map((block, index) => (
        <ReferenceArea
          key={`${block.month}-${index}`}
          y1={block.start}
          y2={block.end}
          x1={0}
          x2={maxDomainValue}
          fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
          fillOpacity={1}
          strokeOpacity={0}
          ifOverflow="extendDomain"
          label={{
            value: block.month,
            position: 'insideTopRight',
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 12,
            fontWeight: 500,
            offset: 10,
          }}
        />
      ))}
    </>
  );
};
