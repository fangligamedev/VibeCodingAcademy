
import React, { useRef, useState, useEffect } from 'react';
import { Terminal, Play, Loader2, Sparkles } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  onRun: () => void;
  isRunning: boolean;
  shouldHighlightRun: boolean;
  placeholderText: string;
  texts: any;
}

const STATIC_KEYWORDS = [
  'import', 'pygame', 'sys', 'def', 'class', 'return', 'if', 'else', 'elif', 
  'while', 'for', 'in', 'print', 'True', 'False', 'None', 'and', 'or', 'not',
  'screen', 'display', 'set_mode', 'flip', 'update', 'caption',
  'draw', 'circle', 'rect', 'line', 'fill', 'blit',
  'event', 'quit', 'get', 'type', 'key', 'main', 'init', 'time', 'Clock', 'tick'
];

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, onRun, isRunning, shouldHighlightRun, placeholderText, texts }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Auto-complete State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [currentWord, setCurrentWord] = useState('');

  // Sync scroll between textarea and pre (for syntax highlighting alignment)
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        
        // Hide suggestions on scroll to prevent misalignment
        setShowSuggestions(false);
    }
  };

  // Ensure sync happens when code changes (e.g. typing at bottom of file forces auto-scroll)
  useEffect(() => {
    if (textareaRef.current && preRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [code]);

  // Simple syntax highlighting logic
  const highlightCode = (input: string) => {
    if (!input) return <span className="text-gray-600 italic">{placeholderText}</span>;
    
    return input.split('\n').map((line, i) => (
      <div key={i} className="min-h-[1.5rem]">
        {line.split(/(\s+|[().,])/g).map((token, j) => {
            if (['import', 'def', 'return', 'class', 'if', 'else', 'from', 'while', 'for', 'in'].includes(token)) return <span key={j} className="text-secondary font-bold">{token}</span>;
            if (['pygame', 'sys', 'screen', 'hero_color', 'display', 'draw', 'event', 'quit'].includes(token.replace(/[().,]/g, ''))) return <span key={j} className="text-blue-300">{token}</span>;
            if (token.startsWith('#')) return <span key={j} className="text-green-500 italic">{token}</span>; 
            if (!isNaN(Number(token))) return <span key={j} className="text-orange-300">{token}</span>;
            if (token.startsWith('"') || token.startsWith("'")) return <span key={j} className="text-yellow-300">{token}</span>;
            return <span key={j} className="text-gray-100">{token}</span>;
        })}
      </div>
    ));
  };

  // Update suggestions based on input
  const updateSuggestions = (value: string, caretPos: number) => {
    const textBeforeCaret = value.slice(0, caretPos);
    const match = textBeforeCaret.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);

    if (match) {
        const word = match[1];
        setCurrentWord(word);

        // 1. Gather dynamic variables from code
        const variableRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
        const foundVariables = new Set<string>();
        let varMatch;
        while ((varMatch = variableRegex.exec(value)) !== null) {
            foundVariables.add(varMatch[1]);
        }
        
        // 2. Combine with static keywords
        const allCandidates = Array.from(new Set([...STATIC_KEYWORDS, ...Array.from(foundVariables)]));

        // 3. Filter
        const filtered = allCandidates.filter(k => 
            k.startsWith(word) && k !== word
        ).slice(0, 5); // Limit to 5 suggestions

        if (filtered.length > 0) {
            setSuggestions(filtered);
            setSuggestionIndex(0);
            setShowSuggestions(true);
            calculateCoords(textBeforeCaret);
        } else {
            setShowSuggestions(false);
        }
    } else {
        setShowSuggestions(false);
    }
  };

  // Calculate pixel coordinates for the suggestion box
  const calculateCoords = (textBeforeCaret: string) => {
    if (!measureRef.current || !textareaRef.current) return;

    // We put text before caret into a hidden div with same styling
    // We add a span at the end to get the offset
    measureRef.current.innerHTML = textBeforeCaret
        .replace(/\n/g, '<br/>')
        .replace(/ /g, '&nbsp;') + '<span id="caret-marker">|</span>';

    const marker = measureRef.current.querySelector('#caret-marker');
    if (marker) {
        const rect = marker.getBoundingClientRect();
        const containerRect = textareaRef.current.getBoundingClientRect();
        
        // Adjust for scroll
        setCoords({
            top: (rect.top - containerRect.top) + textareaRef.current.scrollTop + 24, // 24px line height approx
            left: (rect.left - containerRect.left) + textareaRef.current.scrollLeft
        });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            insertSuggestion(suggestions[suggestionIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    
    const caretPos = textareaRef.current.selectionStart;
    const textBefore = code.slice(0, caretPos);
    const textAfter = code.slice(caretPos);
    
    // Remove the partial word typed so far
    const newTextBefore = textBefore.slice(0, -currentWord.length);
    const newCode = newTextBefore + suggestion + textAfter;
    
    onChange(newCode);
    setShowSuggestions(false);
    
    // Restore focus and move caret
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            const newCaretPos = newTextBefore.length + suggestion.length;
            textareaRef.current.setSelectionRange(newCaretPos, newCaretPos);
        }
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      onChange(newVal);
      updateSuggestions(newVal, e.target.selectionStart);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden shadow-lg flex-1 relative group">
      {/* Editor Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700 shrink-0">
        <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300 font-mono text-sm">main.py</span>
            <span className="text-xs text-gray-500 ml-2">• Python 3.11</span>
        </div>
        <button 
            onClick={onRun}
            disabled={isRunning}
            className={`flex items-center space-x-2 px-3 py-1 text-white text-xs font-bold rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                shouldHighlightRun 
                    ? 'bg-green-500 hover:bg-green-400 ring-4 ring-green-500/30 animate-pulse scale-105 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
                    : 'bg-green-600 hover:bg-green-500'
            }`}
        >
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isRunning ? texts.running : texts.runCode}</span>
        </button>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1e1e1e] border-r border-gray-700 z-20 flex flex-col items-end py-4 pr-2 text-gray-600 font-mono text-sm leading-6 select-none">
            {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>

        {/* Input Textarea */}
        <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            className="absolute top-0 left-10 right-0 bottom-0 w-[calc(100%-2.5rem)] h-full bg-transparent text-transparent caret-white font-mono text-sm leading-6 p-4 resize-none focus:outline-none z-10 whitespace-pre"
        />

        {/* Syntax Highlight Overlay */}
        <pre 
            ref={preRef}
            aria-hidden="true" 
            className="absolute top-0 left-10 right-0 bottom-0 w-[calc(100%-2.5rem)] h-full pointer-events-none font-mono text-sm leading-6 p-4 m-0 overflow-hidden whitespace-pre z-0"
        >
            {highlightCode(code)}
        </pre>

        {/* Hidden Measurement Div for Auto-complete positioning */}
        {/* Must match textarea styles exactly */}
        <div 
            ref={measureRef}
            className="absolute top-0 left-10 right-0 w-[calc(100%-2.5rem)] font-mono text-sm leading-6 p-4 whitespace-pre-wrap invisible pointer-events-none z-0"
            style={{ wordWrap: 'break-word' }}
        />

        {/* Suggestion Box */}
        {showSuggestions && (
            <div 
                className="absolute z-50 bg-[#2d2d2d] border border-gray-600 rounded-md shadow-2xl overflow-hidden min-w-[150px]"
                style={{ top: coords.top, left: coords.left + 40 }} // +40 for sidebar offset
            >
                <div className="text-[10px] bg-gray-700 px-2 py-0.5 text-gray-400 uppercase font-bold tracking-wider flex items-center">
                    <Sparkles className="w-3 h-3 mr-1 text-yellow-400" /> Suggestion
                </div>
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={suggestion}
                            onClick={() => insertSuggestion(suggestion)}
                            className={`px-3 py-1.5 cursor-pointer text-sm font-mono flex justify-between items-center ${index === suggestionIndex ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            <span>{suggestion}</span>
                            {index === suggestionIndex && <span className="text-[10px] opacity-50">Tab</span>}
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
