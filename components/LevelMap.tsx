import React, { useState } from 'react';
import { Play, Star, Lock, Map as MapIcon, ChevronRight } from 'lucide-react';
import { Level, World } from '../types';

interface LevelMapProps {
  levels: Level[];
  worlds: World[];
  completedLevels: Record<number, number>; // LevelId -> Stars
  onSelectLevel: (level: Level) => void;
  texts: any;
}

const LevelMap: React.FC<LevelMapProps> = ({ levels, worlds, completedLevels, onSelectLevel, texts }) => {
  const [selectedWorldId, setSelectedWorldId] = useState(1);
  
  const currentLevels = levels.filter(l => l.worldId === selectedWorldId);

  // Calculate stats for world
  const getWorldStats = (wid: number) => {
    const worldLevels = levels.filter(l => l.worldId === wid);
    const completedCount = worldLevels.filter(l => completedLevels[l.id]).length;
    return { completed: completedCount, total: worldLevels.length };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col md:flex-row gap-8 h-[calc(100vh-80px)]">
      
      {/* Sidebar / Tabs for Worlds */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-4">
        <h2 className="text-xl font-bold text-gray-400 mb-4 px-2 uppercase tracking-widest text-xs">{texts.missionControl}</h2>
        {worlds.map((world) => {
          const stats = getWorldStats(world.id);
          const isSelected = selectedWorldId === world.id;
          
          return (
            <button
              key={world.id}
              onClick={() => setSelectedWorldId(world.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group ${
                isSelected 
                  ? `border-${world.themeColor}-500 bg-${world.themeColor}-900/20` 
                  : 'border-gray-800 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isSelected ? `bg-${world.themeColor}-500 text-white` : 'bg-gray-700 text-gray-400'}`}>
                  {texts.level.toUpperCase()} {((world.id - 1) * 10) + 1} - {world.id * 10}
                </span>
                {isSelected && <ChevronRight className={`w-4 h-4 text-${world.themeColor}-400`} />}
              </div>
              
              <h3 className={`font-bold relative z-10 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {world.title}
              </h3>
              
              <div className="mt-3 flex items-center space-x-1 relative z-10">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full bg-${world.themeColor}-500`} 
                        style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                    />
                </div>
                <span className="text-xs text-gray-500 font-mono">{stats.completed}/{stats.total}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Grid of Levels */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20">
         <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{worlds.find(w => w.id === selectedWorldId)?.title}</h1>
            <p className="text-gray-400">{worlds.find(w => w.id === selectedWorldId)?.description}</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentLevels.map((level, index) => {
            const stars = completedLevels[level.id] || 0;
            // Check global lock logic: level N is locked if level N-1 is not complete
            // Exception: Level 1 is always unlocked.
            const previousLevelId = level.id - 1;
            const isLocked = level.id > 1 && !completedLevels[previousLevelId];
            
            return (
                <div 
                key={level.id}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    isLocked 
                    ? 'border-gray-800 bg-gray-900 opacity-60 cursor-not-allowed' 
                    : 'border-gray-700 bg-gray-800 hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer'
                }`}
                onClick={() => !isLocked && onSelectLevel(level)}
                >
                <div className="h-24 bg-gray-900 relative">
                    <img 
                        src={level.previewImage} 
                        alt={level.title} 
                        className={`w-full h-full object-cover transition-opacity ${isLocked ? 'opacity-20' : 'opacity-60 group-hover:opacity-100'}`} 
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                    {[1, 2, 3].map((s) => (
                        <Star 
                        key={s} 
                        className={`w-3 h-3 ${s <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} 
                        />
                    ))}
                    </div>
                </div>
                
                <div className="p-4">
                    <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{texts.level} {level.id}</span>
                    {isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1 truncate">{level.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5em]">{level.description}</p>
                    
                    {!isLocked && (
                    <button className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-bold flex items-center justify-center transition-colors">
                        <Play className="w-3 h-3 mr-2" /> {texts.startMission}
                    </button>
                    )}
                </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default LevelMap;