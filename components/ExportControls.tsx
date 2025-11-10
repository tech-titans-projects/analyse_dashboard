
import React from 'react';
import { AnalysisResult } from '../types';
import { exportToCsv, exportToJson, exportToPdf } from '../utils/exportUtils';
import { DownloadIcon } from './icons/DownloadIcon';

interface ExportControlsProps {
  data: AnalysisResult[];
}

const ExportControls: React.FC<ExportControlsProps> = ({ data }) => {
  return (
    <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Export as:</span>
      <button onClick={() => exportToCsv(data)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
        CSV
      </button>
      <button onClick={() => exportToJson(data)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
        JSON
      </button>
      <button onClick={() => exportToPdf(data)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
        PDF
      </button>
    </div>
  );
};

export default ExportControls;
