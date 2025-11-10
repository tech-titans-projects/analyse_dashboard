
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalysisResult, Sentiment } from '../types';

interface SummaryVizProps {
  results: AnalysisResult[];
}

const COLORS = {
  [Sentiment.Positive]: '#10B981', // Emerald 500
  [Sentiment.Negative]: '#EF4444', // Red 500
  [Sentiment.Neutral]: '#6B7280',  // Gray 500
};

const SummaryViz: React.FC<SummaryVizProps> = ({ results }) => {
  const data = useMemo(() => {
    const counts = {
      [Sentiment.Positive]: 0,
      [Sentiment.Negative]: 0,
      [Sentiment.Neutral]: 0,
    };
    results.forEach(result => {
      counts[result.sentiment]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [results]);

  return (
    <div className="h-80 w-full">
      <h3 className="text-lg font-semibold text-center mb-2 dark:text-gray-200">Sentiment Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as Sentiment]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ 
                backgroundColor: 'rgba(31, 41, 55, 0.8)', // gray-800 with opacity
                borderColor: '#4B5563', // gray-600
                borderRadius: '0.5rem'
             }}
             itemStyle={{ color: '#F9FAFB' }} // gray-50
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SummaryViz;
