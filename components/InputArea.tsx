
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TextIcon } from './icons/TextIcon';
import { FileIcon } from './icons/FileIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// --- Types for SpeechRecognition API ---
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult extends Array<SpeechRecognitionAlternative> {
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition; };
    webkitSpeechRecognition: { new(): SpeechRecognition; };
  }
}
// --- End Types ---


interface InputAreaProps {
  onAnalyze: (texts: string[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onAnalyze, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechApiSupported, setIsSpeechApiSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSpeechApiSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTextInput(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = `An error occurred: ${event.error}. Please try again.`;
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please make sure your microphone is active and try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone problem. Please check your microphone connection and system settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Permission denied. Please allow microphone access in your browser settings to use this feature.';
          break;
      }
      setSpeechError(errorMessage);
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      // Format the final transcript into separate lines for analysis
      if (finalTranscriptRef.current) {
         setTextInput(prev => prev.trim().replace(/(\.|\?|!) /g, '$1\n').trim());
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
    }
  }, []);

  const handleToggleRecording = () => {
    if (isLoading) return;
    setSpeechError(null);
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTextInput('');
      finalTranscriptRef.current = '';
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSpeechError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTextInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = () => {
    const texts = textInput.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    onAnalyze(texts);
  };

  const handleTabChange = (id: 'text' | 'file') => {
    if (activeTab === id) return;
    
    if (isRecording) {
      recognitionRef.current?.stop();
    }
    setTextInput('');
    setFileName('');
    setSpeechError(null);
    setActiveTab(id);
  }

  const TabButton = useCallback(({ id, label, icon }: { id: 'text' | 'file', label: string, icon: React.ReactElement }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors duration-200 ${
        activeTab === id
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  ), [activeTab, isRecording]);


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4">
          <TabButton id="text" label="Direct Input" icon={<TextIcon />} />
          <TabButton id="file" label="Upload File" icon={<FileIcon />} />
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'text' && (
          <div>
            <div className="relative">
                 <textarea
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value)
                      setSpeechError(null);
                    }}
                    placeholder={isRecording ? "Listening..." : "Enter text here, one entry per line, or use the microphone..."}
                    className="w-full h-48 p-3 pr-14 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 dark:bg-gray-700"
                    disabled={isLoading || isRecording}
                 />
                 {isSpeechApiSupported && (
                    <button 
                        onClick={handleToggleRecording} 
                        disabled={isLoading}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                    >
                        <MicrophoneIcon />
                    </button>
                 )}
            </div>
             {speechError && !isRecording && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2" role="alert">
                    {speechError}
                </p>
             )}
             {!isSpeechApiSupported && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Voice input is not supported by your browser. Try Chrome or Edge.
                </p>
            )}
          </div>
        )}
        {activeTab === 'file' && (
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileIcon />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">.txt file (one entry per line)</p>
              </div>
              <input id="dropzone-file" type="file" accept=".txt" className="hidden" onChange={handleFileChange} disabled={isLoading} />
              {fileName && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{fileName}</p>}
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || textInput.trim().length === 0}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Text'}
        </button>
      </div>
       <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p><span className="font-semibold">Note:</span> Confidence scores and explanations are generated by an AI model and should be considered as estimations. Always review critical results.</p>
        </div>
    </div>
  );
};

export default InputArea;
