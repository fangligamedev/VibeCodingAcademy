
import React, { useState, useEffect, useRef } from 'react';
import { getLevels, getWorlds } from './constants';
import { Level, GameState, ChatMessage, Language } from './types';
import { generateTutorResponse, runPythonCode, explainPythonError } from './services/geminiService';
import { getTranslation } from './i18n';
import LevelMap from './components/LevelMap';
import GamePreview from './components/GamePreview';
import CodeEditor from './components/CodeEditor';
import { Send, ArrowLeft, RotateCcw, CheckCircle, Sparkles, Star, Globe, Mic, Volume2, Trophy, Terminal as TerminalIcon, Monitor } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('zh');
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<Record<number, number>>({});
  
  // Game State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState(''); // Replaced generatedCode with editable code
  const [visualState, setVisualState] = useState<string[]>([]);
  const [isLevelFinished, setIsLevelFinished] = useState(false);
  
  // Guide Focus State: 'INPUT' | 'RUN' | 'FINISH'
  const [guideFocus, setGuideFocus] = useState<'INPUT' | 'RUN' | 'FINISH'>('INPUT');

  // UI State
  const [isGameMaximized, setIsGameMaximized] = useState(false);
  
  // Execution State
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null); // Store recognition instance
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Auto-scroll console
  useEffect(() => {
      if (consoleRef.current) {
          consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
  }, [consoleOutput]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  // Text to Speech
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Speech to Text (Toggle)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    // Stop if currently listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Append text if input is not empty, otherwise set it
      setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
      // We don't auto-stop here to allow continuous dictation, 
      // but standard behavior for simple command is often single-shot. 
      // Let's stop after one sentence for this use case to be snappy.
      setIsListening(false); 
    };

    recognition.onerror = (event: any) => {
      // Ignore 'aborted' error as it happens when we manually stop
      if (event.error !== 'aborted') {
        console.error("Speech recognition error", event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
      setIsListening(false);
    }
  };

  const handleSelectLevel = (level: Level) => {
    setCurrentLevel(level);
    setCurrentStepIndex(0);
    setGameState(GameState.PLAYING);
    setCode(t.pythonCommentHeader);
    setVisualState([]);
    setIsLevelFinished(false);
    setConsoleOutput(t.consoleWaiting);
    setIsGameMaximized(false);
    setGuideFocus('INPUT'); // Start with focus on input
    
    // Initial Tutor Message
    const initialText = `${t.initialGreeting('VibeBot', level.title)} \n\n${t.firstTask} ${level.steps[0].instruction}`;
    const initialMsg: ChatMessage = {
      id: 'init',
      role: 'model',
      text: initialText
    };
    setChatHistory([initialMsg]);
  };

  const handleLevelComplete = () => {
    if (!currentLevel) return;
    const newStars = {...completedLevels, [currentLevel.id]: 3};
    setCompletedLevels(newStars);
    setGameState(GameState.COMPLETED);
    setIsGameMaximized(false);
    setGuideFocus('INPUT');
  };

  const handleRunCode = async () => {
      if (!currentLevel || isRunningCode) return;
      
      setIsRunningCode(true);
      setConsoleOutput(t.running);

      try {
        const step = currentLevel.steps[currentStepIndex];
        const result = await runPythonCode(code, step, language);
        
        setConsoleOutput(result.consoleOutput);

        if (result.isSuccess) {
            // Visual Update
            if (result.visualAction) {
                setVisualState(prev => [...prev, result.visualAction!]);
            }
            
            // Advance Step Logic
            if (currentStepIndex < currentLevel.steps.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
                // After running successfully, user needs to input next command
                setGuideFocus('INPUT'); 
                
                setTimeout(() => {
                    const nextStep = currentLevel.steps[currentStepIndex + 1];
                    const nextMsgText = `${t.executionSuccess}! ${t.nextStep} ${nextStep.instruction}`;
                    const nextMsg: ChatMessage = {
                        id: Date.now().toString(),
                        role: 'model',
                        text: nextMsgText
                    };
                    setChatHistory(prev => [...prev, nextMsg]);
                    speakText(nextMsgText);
                }, 1000);
            } else {
                setIsLevelFinished(true);
                setGuideFocus('FINISH'); // Focus on finish button
                const finishMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'model',
                    text: t.allStepsDone
                };
                setChatHistory(prev => [...prev, finishMsg]);
                speakText(t.allStepsDone);
            }
        } else {
            // Execution Failed logic
            // Call AI to explain the error
            const explanation = await explainPythonError(code, result.consoleOutput, language);
            
            setGuideFocus('INPUT'); // Return focus to input/editor to fix it
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'model',
                text: explanation || t.errorDetected // Use AI explanation or fallback
            };
            setChatHistory(prev => [...prev, errorMsg]);
            speakText(explanation || t.errorDetected);
        }
      } catch (e) {
          setConsoleOutput(t.executionError);
          setGuideFocus('INPUT');
      } finally {
          setIsRunningCode(false);
      }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentLevel || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateTutorResponse(
        userMsg.text,
        currentLevel,
        currentStepIndex,
        chatHistory.map(c => ({ role: c.role, text: c.text })),
        language
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.message,
        pythonCode: response.pythonCode,
        isCorrect: response.isStepComplete,
        visualAction: response.visualAction 
      };

      setChatHistory(prev => [...prev, botMsg]);
      
      if (response.isStepComplete) {
         speakText(response.message);
         // If AI gives code, append it
         if (response.pythonCode) {
            setCode(prev => prev + "\n" + response.pythonCode);
            // IMPORTANT: Switch focus to RUN button
            setGuideFocus('RUN');
         }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (gameState === GameState.MENU) {
    return (
        <div className="min-h-screen bg-dark font-sans">
            <header className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 z-50 bg-dark/95 backdrop-blur">
                <div className="flex items-center text-2xl font-bold">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary mr-2">VibeCoder</span>
                    <span className="text-white">Academy</span>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={toggleLanguage}
                        className="flex items-center px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm"
                    >
                        <Globe className="w-4 h-4 mr-2" />
                        {language === 'zh' ? 'English' : '中文'}
                    </button>
                    <div className="flex items-center space-x-2 text-yellow-400">
                        <Star className="fill-current" />
                        <span className="font-mono text-xl">{Object.values(completedLevels).reduce((a: number, b: number) => a + b, 0)}</span>
                    </div>
                </div>
            </header>
            <LevelMap 
                levels={getLevels(language)} 
                worlds={getWorlds(language)}
                completedLevels={completedLevels} 
                onSelectLevel={handleSelectLevel} 
                texts={t}
            />
        </div>
    );
  }

  if (gameState === GameState.COMPLETED) {
      return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full text-center border border-primary shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-in fade-in zoom-in duration-300">
                <div className="mb-6 flex justify-center">
                    <Trophy className="w-24 h-24 text-yellow-400 animate-bounce" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{t.missionAccomplished}</h2>
                <p className="text-gray-400 mb-6">{t.youUsedVibe}</p>
                <div className="flex justify-center space-x-2 mb-8">
                    {[1, 2, 3].map(i => <Star key={i} className="w-10 h-10 text-yellow-400 fill-current" />)}
                </div>
                <button 
                    onClick={() => setGameState(GameState.MENU)}
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 transition-opacity transform hover:scale-105"
                >
                    {t.returnToBase}
                </button>
            </div>
        </div>
      )
  }

  // PLAYING STATE
  return (
    <div className="h-screen bg-dark flex flex-col overflow-hidden relative">
        
      {/* Fullscreen Overlay for Game Preview */}
      {isGameMaximized && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200">
             <GamePreview 
                visualState={visualState} 
                texts={t} 
                targetImage={currentLevel?.previewImage}
                isMaximized={true}
                onToggleMaximize={() => setIsGameMaximized(false)}
            />
        </div>
      )}

      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 relative z-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setGameState(GameState.MENU)}
            className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-white text-sm md:text-base">{currentLevel?.title}</h1>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{t.step} {currentStepIndex + 1}/{currentLevel?.steps.length}</span>
                <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-secondary transition-all duration-500" 
                        style={{ width: `${((currentStepIndex) / (currentLevel?.steps.length || 1)) * 100}%` }} 
                    />
                </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
            {isLevelFinished && (
                <button 
                    onClick={handleLevelComplete}
                    className={`flex items-center space-x-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all text-sm ${guideFocus === 'FINISH' ? 'animate-pulse ring-4 ring-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.8)]' : ''}`}
                >
                    <Star className="w-3 h-3 fill-current" />
                    <span>{t.finishLevel}</span>
                </button>
            )}
            
            <button 
                onClick={toggleLanguage}
                className="flex items-center px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-xs"
            >
                <Globe className="w-3 h-3 mr-1" />
                {language === 'zh' ? 'EN' : '中'}
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Game & Code (Vertical Layout) */}
        <div className="w-7/12 md:w-2/3 flex flex-col border-r border-gray-800 bg-[#151515]">
            
            {/* Top: Game Visual Preview (Increased Size) */}
            <div className="h-96 shrink-0 p-4 border-b border-gray-800 bg-gray-900/50 flex space-x-4">
                 <div className="h-full w-full bg-black rounded-lg overflow-hidden border border-gray-700 shadow-md relative">
                    {!isGameMaximized ? (
                        <GamePreview 
                            visualState={visualState} 
                            texts={t} 
                            targetImage={currentLevel?.previewImage}
                            isMaximized={false}
                            onToggleMaximize={() => setIsGameMaximized(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/50">
                            <Monitor className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-sm font-mono">{t.windowMaximizedPlaceholder}</span>
                            <button 
                                onClick={() => setIsGameMaximized(false)}
                                className="mt-4 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs border border-gray-600 transition-colors"
                            >
                                {t.minimize}
                            </button>
                        </div>
                    )}
                 </div>
            </div>

            {/* Middle: Editable Code Editor (Flex Grow - Biggest Area) */}
            <div className="flex-1 min-h-0 flex flex-col p-4">
                <div className="flex items-center justify-between mb-2">
                     <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t.generatedCode}</h2>
                </div>
                <CodeEditor 
                    code={code} 
                    onChange={setCode}
                    onRun={handleRunCode}
                    isRunning={isRunningCode}
                    shouldHighlightRun={guideFocus === 'RUN'}
                    placeholderText={t.waitingForCode}
                    texts={t}
                />
            </div>

            {/* Bottom: Console Output (Fixed Height) */}
            <div className="h-40 shrink-0 bg-[#0f0f0f] border-t border-gray-700 flex flex-col">
                <div className="px-4 py-1 bg-[#1a1a1a] border-b border-gray-800 flex items-center">
                    <TerminalIcon className="w-3 h-3 text-gray-500 mr-2" />
                    <span className="text-xs text-gray-400 font-mono">{t.consoleTitle}</span>
                </div>
                <div ref={consoleRef} className="flex-1 p-3 overflow-y-auto font-mono text-xs md:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {consoleOutput}
                </div>
            </div>
        </div>

        {/* RIGHT: Chat Agent */}
        <div className="w-5/12 md:w-1/3 flex flex-col bg-gray-900 border-l border-gray-800">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex items-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">{t.aiCoach}</h3>
                    <p className="text-xs text-gray-400">{t.alwaysHelp}</p>
                </div>
            </div>

            {/* Chat History */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            <div 
                                className={`p-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.role === 'model' && msg.isCorrect && (
                                    <div className="mt-2 flex items-center text-green-400 text-xs font-bold bg-green-400/10 p-1.5 rounded">
                                        <CheckCircle className="w-3 h-3 mr-1" /> {t.stepComplete}
                                    </div>
                                )}
                            </div>
                            
                            {/* TTS Button */}
                            {msg.role === 'model' && (
                                <button 
                                    onClick={() => speakText(msg.text)}
                                    className="p-1.5 rounded-full hover:bg-gray-700 text-gray-500 hover:text-white transition-colors"
                                    title={t.speak}
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700 shadow-sm">
                             <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hint Box */}
            {!isLevelFinished && (
                <div className={`px-4 py-3 bg-gray-800/30 border-t border-gray-800 transition-all duration-300 ${
                    guideFocus === 'RUN' 
                        ? 'bg-yellow-500/10 animate-pulse' 
                        : guideFocus === 'INPUT' 
                            ? 'bg-indigo-500/10 animate-pulse' 
                            : ''
                }`}>
                    <div className={`flex items-start space-x-2 text-xs font-medium transition-transform duration-300 ${
                        guideFocus === 'RUN' 
                            ? 'text-yellow-400 scale-105' 
                            : 'text-yellow-500/90'
                    }`}>
                        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                        {guideFocus === 'RUN' ? (
                             <p>{t.clickRunHint}</p>
                        ) : (
                             <p>{t.hint}: {currentLevel?.steps[currentStepIndex].hint}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 pb-8">
                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isListening ? t.listening : t.typePlaceholder}
                            className={`w-full bg-gray-800 text-white pl-4 pr-12 py-3 rounded-xl border transition-all duration-300 ${isListening ? 'border-red-500 ring-2 ring-red-500/50' : 'border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary'} ${guideFocus === 'INPUT' ? 'ring-2 ring-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : ''} focus:outline-none placeholder-gray-500`}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 p-1.5 bg-primary text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>

                    <button 
                        onClick={toggleListening}
                        className={`p-3 rounded-xl border transition-all duration-300 ${
                            isListening 
                                ? 'bg-red-500 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:border-gray-600'
                        }`}
                        title="Voice Input"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
