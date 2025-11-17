
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TextIcon } from './icons/TextIcon';
import { FileIcon } from './icons/FileIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { getSpellingSuggestions } from '../services/geminiService';

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

interface SuggestionsState {
  visible: boolean;
  loading: boolean;
  top: number;
  left: number;
  suggestions: string[];
  selectionStart: number;
  selectionEnd: number;
}

const InputArea: React.FC<InputAreaProps> = ({ onAnalyze, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechApiSupported, setIsSpeechApiSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState>({
    visible: false,
    loading: false,
    top: 0,
    left: 0,
    suggestions: [],
    selectionStart: 0,
    selectionEnd: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
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

  // Effect to hide suggestions popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            suggestionsState.visible &&
            popoverRef.current && 
            !popoverRef.current.contains(event.target as Node) &&
            textareaRef.current &&
            !textareaRef.current.contains(event.target as Node)
        ) {
            setSuggestionsState(prevState => ({ ...prevState, visible: false }));
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [suggestionsState.visible]);


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

  const handleTextSelect = async (event: React.MouseEvent<HTMLTextAreaElement>) => {
    if (event.button === 2 || isLoading || isRecording) { // Ignore right-clicks & when busy
      if (suggestionsState.visible) {
        setSuggestionsState({ ...suggestionsState, visible: false });
      }
      return;
    }
    
    const textarea = event.currentTarget;
    let { selectionStart, selectionEnd } = textarea;
    let selectedWord = textarea.value.substring(selectionStart, selectionEnd);

    // If no text is highlighted (it's a click), find the word under the cursor
    if (selectedWord.length === 0 && selectionStart > 0) {
      const text = textarea.value;
      let start = text.substring(0, selectionStart).search(/\S+$/);
      if (start === -1) start = selectionStart;

      let end = text.substring(selectionStart).search(/\s|$/);
      end = (end === -1) ? text.length : selectionStart + end;
      
      selectedWord = text.substring(start, end);
      selectionStart = start;
      selectionEnd = end;
    }

    const wordToSearch = selectedWord.trim().replace(/[.,!?;:"]$/, ''); // Clean word
    
    if (wordToSearch.length > 1 && !/\s/.test(wordToSearch)) {
      setSuggestionsState({
        visible: true,
        loading: true,
        top: event.clientY + 15,
        left: event.clientX,
        suggestions: [],
        selectionStart: selectionStart,
        selectionEnd: selectionEnd,
      });

      const suggestions = await getSpellingSuggestions(wordToSearch);

      setSuggestionsState(prevState => {
        // Abort if a new selection was made while waiting for the API
        if (prevState.selectionStart !== selectionStart || prevState.selectionEnd !== selectionEnd) {
           return prevState;
        }
        return {
          ...prevState,
          loading: false,
          suggestions: suggestions,
          visible: suggestions.length > 0,
        }
      });
    } else {
      if (suggestionsState.visible) {
          setSuggestionsState({ ...suggestionsState, visible: false });
      }
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileName(files.length === 1 ? files[0].name : `${files.length} files selected`);
      setSpeechError(null);
      setTextInput(''); // Clear previous content while reading new files

      const fileReadPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = e => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsText(file);
        });
      });

      Promise.all(fileReadPromises)
        .then(contents => {
          // Join the content of all files, separated by a newline
          setTextInput(contents.join('\n'));
        })
        .catch(error => {
          console.error("Error reading files:", error);
          // FIX: The `error` object in a catch block is of type `unknown`. We must
          // perform a type check to ensure it is an `Error` instance before
          // accessing its `message` property. This prevents a runtime crash and
          // allows us to display a helpful error message to the user.
          let message = "An error occurred while reading the files. Please ensure they are valid text files.";
          if (error instanceof Error) {
            message = error.message;
          }
          setSpeechError(message);
          setFileName(''); // Reset file name on error
        });
    } else {
      setFileName('');
      setTextInput('');
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

  const SuggestionsPopover = () => {
    if (!suggestionsState.visible) return null;

    const handleSuggestionClick = (suggestion: string) => {
        const currentText = textInput;
        const newText = 
            currentText.slice(0, suggestionsState.selectionStart) + 
            suggestion + 
            currentText.slice(suggestionsState.selectionEnd);
        
        setTextInput(newText);
        setSuggestionsState({ ...suggestionsState, visible: false });

        // Restore focus and cursor position after replacement
        if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = suggestionsState.selectionStart + suggestion.length;
            // Use timeout to ensure state update has rendered
            setTimeout(() => {
                textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    };

    return (
        <div 
            ref={popoverRef}
            className="fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-1 min-w-[120px]"
            style={{ top: `${suggestionsState.top}px`, left: `${suggestionsState.left}px` }}
        >
            {suggestionsState.loading && (
              <div className="flex items-center justify-center p-2">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                 <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Checking...</span>
              </div>
            )}
            {!suggestionsState.loading && suggestionsState.suggestions.length > 0 && (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {suggestionsState.suggestions.map((s, i) => (
                        <li key={i}>
                            <button 
                                onClick={() => handleSuggestionClick(s)}
                                className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                                {s}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
  };


  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      <SuggestionsPopover />
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
                    ref={textareaRef}
                    value={textInput}
                    onMouseUp={handleTextSelect}
                    onChange={(e) => {
                      setTextInput(e.target.value)
                      setSpeechError(null);
                      if (suggestionsState.visible) {
                        setSuggestionsState(s => ({...s, visible: false}));
                      }
                    }}
                    placeholder={isRecording ? "Listening..." : "Enter text here, one entry per line, or use the microphone..."}
                    className="w-full h-48 p-3 pr-14 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 dark:bg-gray-700"
                    disabled={isLoading || isRecording}
                    spellCheck={true}
                    autoCorrect="on"
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
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tip: Misspelled words are underlined. Highlight or click a word to get AI-powered correction suggestions.
            </p>
          </div>
        )}
        {activeTab === 'file' && (
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileIcon />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">.txt files (one entry per line)</p>
              </div>
              <input id="dropzone-file" type="file" accept=".txt" className="hidden" onChange={handleFileChange} disabled={isLoading} multiple />
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
