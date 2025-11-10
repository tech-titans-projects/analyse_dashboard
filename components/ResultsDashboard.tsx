
import React from 'react';
import { AnalysisResult } from '../types';
import SummaryViz from './SummaryViz';
import ResultsTable from './ResultsTable';
import ExportControls from './ExportControls';

interface ResultsDashboardProps {
  results: AnalysisResult[];
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results }) => {
  return (
    <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analysis Results</h2>
                <ExportControls data={results} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                   <SummaryViz results={results} />
                </div>
                <div className="lg:col-span-2">
                    <ResultsTable results={results} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default ResultsDashboard;
