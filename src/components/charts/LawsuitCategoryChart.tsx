"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import type { LawsuitCategory } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  discrimination: "#ef4444",
  harassment: "#ec4899",
  retaliation: "#f97316",
  wage_hour: "#eab308",
  wrongful_termination: "#a855f7",
  class_action: "#3b82f6",
  sec_action: "#06b6d4",
  other: "#6b7280",
};

interface LawsuitCategoryChartProps {
  categories: LawsuitCategory[];
}

export function LawsuitCategoryChart({ categories }: LawsuitCategoryChartProps) {
  const data = categories.map((c) => ({
    name: c.category.replace("_", " "),
    count: c.count,
    category: c.category,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(categories.length * 40, 120)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "#888", fontSize: 11 }}
          axisLine={false}
          width={120}
          style={{ textTransform: "capitalize" }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#6b7280"} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
