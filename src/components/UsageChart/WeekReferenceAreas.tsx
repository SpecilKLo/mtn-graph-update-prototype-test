import { ReferenceArea } from "recharts";
import type { WeekBlock } from "./types";

interface WeekReferenceAreasProps {
  weekBlocks: WeekBlock[];
  maxDomainValue: number;
}

export const WeekReferenceAreas = ({ weekBlocks, maxDomainValue }: WeekReferenceAreasProps) => {
  return (
    <>
      {weekBlocks.map((block, index) => (
        <ReferenceArea
          key={`week-${block.weekNumber}-${index}`}
          y1={block.start}
          y2={block.end}
          x1={0}
          x2={maxDomainValue}
          fill={index % 2 === 0 ? "#F5F5F5" : "transparent"}
          fillOpacity={1}
          strokeOpacity={0}
          ifOverflow="extendDomain"
        />
      ))}
    </>
  );
};
