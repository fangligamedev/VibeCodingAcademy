
import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Eye, Target, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface DrawingCommand {
    type: 'fill' | 'circle' | 'rect' | 'text' | 'clear';
    color?: string;
    x?: number;
    y?: number;
    radius?: number;
    width?: number;
    height?: number;
    text?: string;
}

interface GamePreviewProps {
  visualState: DrawingCommand[][]; // List of command batches
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

    // Default background (Simulate uninitialized screen)
    // If no history, show "OS Not Loaded"
    if (visualState.length === 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '20px "Fredoka", sans-serif'; 
        ctx.textAlign = 'center';
        ctx.fillText(texts.osNotLoaded, canvas.width / 2, canvas.height / 2);
        return;
    }

    // Replay history to build current state
    // We only render the LATEST batch of commands for the current frame usually, 
    // but to persist state we might need to replay or assume the latest batch is the full frame.
    // For simplicity in this Vibe Coding context, let's assume the latest execution returns the full desired state 
    // OR we clear and redraw based on the latest successful run.
    // Let's try rendering just the latest batch to simulate "current frame".
    
    const latestCommands = visualState[visualState.length - 1] || [];
    
    console.log('[GamePreview] Latest commands:', latestCommands);
    console.log('[GamePreview] Full visualState:', visualState);

    // Clear canvas before drawing new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Default to black background, but it will be overridden by 'fill' command if present
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    latestCommands.forEach((cmd, index) => {
      console.log(`[GamePreview] Processing command ${index}:`, cmd);
      
      switch (cmd.type) {
        case 'fill':
          // Use the exact color provided by the LLM
          // Ensure fallback to valid black if color is missing/invalid, but prioritize cmd.color
          let fillColor = cmd.color;
          if (!fillColor || fillColor === 'undefined') fillColor = '#000000';
          
          console.log(`[GamePreview] Filling with color: ${fillColor} (Original: ${cmd.color})`);
          ctx.fillStyle = fillColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
          
        case 'circle':
          ctx.fillStyle = cmd.color || '#FFFFFF';
          ctx.strokeStyle = cmd.color || '#FFFFFF';
          if (cmd.x !== undefined && cmd.y !== undefined && cmd.radius !== undefined) {
              ctx.beginPath();
              ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
              ctx.fill();
          }
          break;

        case 'rect':
            if (cmd.x !== undefined && cmd.y !== undefined && cmd.width !== undefined && cmd.height !== undefined) {
                ctx.fillRect(cmd.x, cmd.y, cmd.width, cmd.height);
            }
            break;
        
        case 'text':
            if (cmd.x !== undefined && cmd.y !== undefined && cmd.text) {
                ctx.font = '20px "Fredoka", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(cmd.text, cmd.x, cmd.y);
            }
            break;

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
