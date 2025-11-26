import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Eye, Target, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface GamePreviewProps {
  visualState: string[]; // List of accumulated actions
  texts: any;
  targetImage?: string;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

const GamePreview: React.FC<GamePreviewProps> = ({ visualState, texts, targetImage, isMaximized, onToggleMaximize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'live' | 'target'>('live');
  const [successFlash, setSuccessFlash] = useState(false);
  const prevLengthRef = useRef(visualState.length);

  // Detect new visual actions to trigger flash
  useEffect(() => {
      if (visualState.length > prevLengthRef.current) {
          setSuccessFlash(true);
          const t = setTimeout(() => setSuccessFlash(false), 1500); // Flash duration
          prevLengthRef.current = visualState.length;
          return () => clearTimeout(t);
      }
      prevLengthRef.current = visualState.length;
  }, [visualState.length]);

  useEffect(() => {
    // If in target mode, don't draw canvas
    if (viewMode === 'target') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Default background (Simulate uninitialized screen)
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '20px "Fredoka", sans-serif'; // Use app font for better Chinese rendering support
    ctx.textAlign = 'center';
    ctx.fillText(texts.osNotLoaded, canvas.width / 2, canvas.height / 2);

    // Replay history to build current state
    visualState.forEach(action => {
      switch (action) {
        case 'CREATE_SCREEN':
          // Simulate window creation (just clears the "Not Loaded" text)
          ctx.fillStyle = '#1a1a1a'; // Dark grey default
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
          
        case 'FILL_BLACK':
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;

        case 'FILL_RED':
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;

        case 'DRAW_HERO':
          ctx.fillStyle = '#0000FF'; // Blue hero
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
          ctx.fill();
          
          // Add a glow effect
          ctx.shadowBlur = 20;
          ctx.shadowColor = "blue";
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;

        case 'DRAW_HERO_MOVED':
            // Draw hero at new position (simulated)
            ctx.fillStyle = '#0000FF';
            ctx.beginPath();
            ctx.arc(150, 100, 30, 0, Math.PI * 2); // Hardcoded visual for demo
            ctx.fill();
            break;
          
        // Add more visual cases here as needed
        default:
            break;
      }
    });

    // Overlay scanlines for retro feel
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let i = 0; i < canvas.height; i += 4) {
      ctx.fillRect(0, i, canvas.width, 2);
    }

  }, [visualState, texts, viewMode]);

  return (
    <div className={`relative w-full h-full bg-black rounded-lg overflow-hidden border-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-500 ${isMaximized ? 'rounded-none border-0' : (successFlash ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'border-gray-700')}`}>
      {/* Header Bar */}
      <div className="bg-gray-800 flex items-center justify-between px-3 py-1.5 shrink-0 z-20 border-b border-gray-700">
        
        {/* Left: Window Controls & Title */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 cursor-pointer"></div>
          </div>
          <span className="text-xs text-gray-400 font-mono hidden sm:inline-block">{texts.pythonWindow}</span>
        </div>

        {/* Right: Toggles & Maximize */}
        <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-600">
                <button 
                    onClick={() => setViewMode('live')}
                    className={`flex items-center px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${viewMode === 'live' ? 'bg-gray-700 text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Eye className="w-3 h-3 mr-1" /> {texts.live}
                </button>
                <button 
                    onClick={() => setViewMode('target')}
                    className={`flex items-center px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${viewMode === 'target' ? 'bg-gray-700 text-yellow-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Target className="w-3 h-3 mr-1" /> {texts.target}
                </button>
            </div>

            {/* Maximize Button */}
            <button 
                onClick={onToggleMaximize}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                title={isMaximized ? texts.minimize : texts.maximize}
            >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
        {/* Success Indicator Overlay */}
        {successFlash && viewMode === 'live' && (
            <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                <div className="bg-green-500/10 p-6 rounded-full border border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.5)] backdrop-blur-sm">
                    <CheckCircle className="w-16 h-16 text-green-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
            </div>
        )}

        {viewMode === 'live' ? (
             <canvas 
                ref={canvasRef} 
                width={800} 
                height={600} 
                className="w-full h-full object-contain"
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {targetImage ? (
                    <img 
                        src={targetImage} 
                        alt="Target Goal" 
                        className="max-w-full max-h-full object-contain rounded border-2 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]" 
                    />
                ) : (
                    <div className="text-gray-500 flex flex-col items-center">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-xs">No preview available</span>
                    </div>
                )}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none">
                     🎯 {texts.target}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GamePreview;