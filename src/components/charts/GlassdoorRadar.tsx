"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import type { GlassdoorSnapshot } from "@/types";

interface GlassdoorRadarProps {
  glassdoor: GlassdoorSnapshot;
}

export function GlassdoorRadar({ glassdoor }: GlassdoorRadarProps) {
  const data = [
    { subject: "Overall", value: glassdoor.overall, fullMark: 5 },
    { subject: "Culture", value: glassdoor.culture, fullMark: 5 },
    { subject: "Leadership", value: glassdoor.leadership, fullMark: 5 },
    { subject: "Work-Life", value: glassdoor.workLife, fullMark: 5 },
    { subject: "Comp", value: glassdoor.compensation, fullMark: 5 },
    { subject: "Career", value: glassdoor.careerOpportunities, fullMark: 5 },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#333" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#888", fontSize: 11 }}
        />
        <Radar
          name="Rating"
          dataKey="value"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
