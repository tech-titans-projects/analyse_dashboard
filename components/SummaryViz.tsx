import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Label
} from 'recharts';
import { AnalysisResult, Sentiment } from '../types';

interface SummaryVizProps {
  results: AnalysisResult[];
}

const COLORS = {
  [Sentiment.Positive]: '#10B981', // Emerald 500
  [Sentiment.Negative]: '#EF4444', // Red 500
  [Sentiment.Neutral]: '#6B7280',  // Gray 500
};

type ChartType = 'pie' | 'bar' | 'histogram';

const SummaryViz: React.FC<SummaryVizProps> = ({ results }) => {
  const [chartType, setChartType] = useState<ChartType>('pie');

  const sentimentDistributionData = useMemo(() => {
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

  const confidenceHistogramData = useMemo(() => {
      const binCount = 10;
      const bins = Array.from({ length: binCount }, (_, i) => ({
        name: `${(i * 10)}%-${((i + 1) * 10)}%`,
        count: 0,
      }));

      results.forEach(result => {
        // handle confidence of 1.0 correctly
        const binIndex = Math.min(Math.floor(result.confidence * binCount), binCount - 1);
        if (bins[binIndex]) {
          bins[binIndex].count++;
        }
      });
      return bins;
    }, [results]);

  const getButtonClass = (type: ChartType) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors";
    if (chartType === type) {
      return `${baseClasses} bg-blue-600 text-white`;
    }
    return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600`;
  };

  const renderChart = () => {
    switch (chartType) {
        case 'pie':
            return (
                <PieChart>
                  <Pie
                    data={sentimentDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent === 0) return null;
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
                    {sentimentDistributionData.map((entry, index) => (
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
            );
        case 'bar':
            return (
                <BarChart data={sentimentDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                     contentStyle={{
                        backgroundColor: 'rgba(31, 41, 55, 0.8)',
                        borderColor: '#4B5563',
                        borderRadius: '0.5rem'
                     }}
                     itemStyle={{ color: '#F9FAFB' }}
                     cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Count">
                     {sentimentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as Sentiment]} />
                     ))}
                  </Bar>
                </BarChart>
            );
        case 'histogram':
            return (
                <BarChart data={confidenceHistogramData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="name">
                         <Label value="Confidence Score" offset={-15} position="insideBottom" />
                    </XAxis>
                    <YAxis allowDecimals={false}>
                        <Label value="Count" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.8)',
                            borderColor: '#4B5563',
                            borderRadius: '0.5rem'
                        }}
                        itemStyle={{ color: '#F9FAFB' }}
                        cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                    />
                    <Bar dataKey="count" fill="#8884d8" name="Frequency" />
                </BarChart>
            );
        default:
            return null;
    }
  }


  return (
    <div>
      <h3 className="text-lg font-semibold text-center mb-2 dark:text-gray-200">
        {chartType === 'histogram' ? 'Confidence Score Distribution' : 'Sentiment Distribution'}
      </h3>
      <div className="flex justify-center space-x-2 mb-4">
        <button onClick={() => setChartType('pie')} className={getButtonClass('pie')}>
          Pie Chart
        </button>
        <button onClick={() => setChartType('bar')} className={getButtonClass('bar')}>
          Bar Chart
        </button>
        <button onClick={() => setChartType('histogram')} className={getButtonClass('histogram')}>
          Histogram
        </button>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SummaryViz;