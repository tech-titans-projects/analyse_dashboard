
import React from 'react';
import { AnalysisResult, Sentiment } from '../types';

interface ResultsTableProps {
  results: AnalysisResult[];
}

const sentimentStyles: { [key in Sentiment]: string } = {
  [Sentiment.Positive]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [Sentiment.Negative]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [Sentiment.Neutral]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const SentimentBadge: React.FC<{ sentiment: Sentiment }> = ({ sentiment }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${sentimentStyles[sentiment]}`}>
    {sentiment}
  </span>
);

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  return (
    <div className="overflow-x-auto max-h-[24rem] pr-2">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
          <tr>
            <th scope="col" className="px-4 py-3">Sentiment</th>
            <th scope="col" className="px-4 py-3">Confidence</th>
            <th scope="col" className="px-4 py-3">Analyzed Text & Keywords</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="px-4 py-4 align-top">
                <SentimentBadge sentiment={result.sentiment} />
              </td>
              <td className="px-4 py-4 align-top font-mono">
                {(result.confidence * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold text-gray-900 dark:text-white break-words">"{result.originalText}"</p>
                <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1 break-words">Explanation: {result.explanation}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.keywords.map((keyword, kwIndex) => (
                    <span key={kwIndex} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                      {keyword}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
