import React from 'react';
import { X, ChevronRight, Sparkles } from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
  texts: any;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose, texts }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-primary/50 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.3)] max-w-4xl w-full overflow-hidden relative flex flex-col md:flex-row">
        
        {/* Left Side: Hero Content */}
        <div className="md:w-1/2 p-8 relative z-10 flex flex-col justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
            </div>

            <div className="relative z-10 text-center md:text-left">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg transform -rotate-3 mx-auto md:mx-0">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                    {texts.tutorialTitle || "Welcome to Vibe Coding!"}
                </h2>
                
                <div className="space-y-4 text-gray-300 text-base leading-relaxed mb-8">
                    <p>{texts.tutorialStep1 || "Here, you don't write code line-by-line."}</p>
                    <p><strong className="text-white text-lg">{texts.tutorialStep2 || "You just TELL the AI what you want!"}</strong></p>
                    <div className="text-sm text-gray-400 bg-black/30 p-3 rounded-lg border border-gray-700/50">
                        {texts.tutorialStep3 || "Try saying: 'Draw a red circle'"}
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="group w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary to-secondary hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center"
                >
                    <span>{texts.tutorialStart || "Let's Go!"}</span>
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>

        {/* Right Side: UI Walkthrough Visual */}
        <div className="md:w-1/2 bg-gray-950 p-6 flex flex-col justify-center relative border-t md:border-t-0 md:border-l border-gray-800">
            <h3 className="text-white font-bold mb-6 text-center text-lg uppercase tracking-wider text-gray-500">Interface Guide</h3>
            
            <div className="space-y-4">
                {/* Chat Area Highlight */}
                <div className="flex items-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💬</div>
                    <div className="ml-4">
                        <h4 className="text-white font-bold text-sm">AI Coach (Chat)</h4>
                        <p className="text-xs text-gray-500">Your mission control. Talk to VibeBot here.</p>
                    </div>
                </div>

                {/* Code Editor Highlight */}
                <div className="flex items-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-secondary/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📝</div>
                    <div className="ml-4">
                        <h4 className="text-white font-bold text-sm">Code Editor</h4>
                        <p className="text-xs text-gray-500">Watch the AI write Python code for you.</p>
                    </div>
                </div>

                {/* Preview Highlight */}
                <div className="flex items-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-green-500/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎮</div>
                    <div className="ml-4">
                        <h4 className="text-white font-bold text-sm">Game Preview</h4>
                        <p className="text-xs text-gray-500">See your game come to life instantly!</p>
                    </div>
                </div>

                 {/* Terminal Highlight */}
                 <div className="flex items-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-yellow-500/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💻</div>
                    <div className="ml-4">
                        <h4 className="text-white font-bold text-sm">Terminal</h4>
                        <p className="text-xs text-gray-500">Check system output and errors.</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialOverlay;
