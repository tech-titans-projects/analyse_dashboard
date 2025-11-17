import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
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
    // Create 10 bins for confidence scores from 0-100%
    const bins = Array.from({ length: 10 }, (_, i) => ({
      name: `${i * 10}`, // Use starting percentage for cleaner labels
      Frequency: 0,
    }));

    // Group results into bins based on their confidence score
    results.forEach(result => {
      const confidencePercent = result.confidence * 100;
      // Handle the edge case of 100% confidence
      const binIndex = Math.min(Math.floor(confidencePercent / 10), 9);
      bins[binIndex].Frequency++;
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
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
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
                        backgroundColor: 'rgba(31, 41, 55, 0.9)',
                        borderColor: '#4B5563',
                        borderRadius: '0.5rem'
                     }}
                     itemStyle={{ color: '#F9FAFB' }}
                  />
                  <Legend />
                </PieChart>
            );
        case 'bar':
             return (
                <BarChart data={sentimentDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'currentColor' }} />
                  <Tooltip
                     contentStyle={{
                        backgroundColor: 'rgba(31, 41, 55, 0.9)',
                        borderColor: '#4B5563',
                        borderRadius: '0.5rem'
                     }}
                     itemStyle={{ color: '#F9FAFB' }}
                     cursor={{fill: 'rgba(128, 128, 128, 0.2)'}}
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
                <BarChart data={confidenceHistogramData} margin={{ top: 5, right: 20, left: 20, bottom: 40 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                   <XAxis 
                    dataKey="name" 
                    unit="%" 
                    tick={{ fill: 'currentColor', fontSize: 12 }} 
                    interval={1}
                    height={50}
                    label={{ value: 'Confidence Score', position: 'insideBottom', offset: -20, fill: 'currentColor' }}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: 'currentColor' }} 
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: 'currentColor', style: {textAnchor: 'middle'} }}
                  />
                  <Tooltip
                     contentStyle={{
                        backgroundColor: 'rgba(31, 41, 55, 0.9)',
                        borderColor: '#4B5563',
                        borderRadius: '0.5rem'
                     }}
                     itemStyle={{ color: '#F9FAFB' }}
                     cursor={{fill: 'rgba(128, 128, 128, 0.2)'}}
                  />
                  <Bar dataKey="Frequency" fill="#60A5FA" />
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