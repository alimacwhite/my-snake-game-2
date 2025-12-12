import React from 'react';
import { GameStatus, Direction } from '../types';
import { Play, RotateCcw, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ControlsProps {
  status: GameStatus;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
  onDirectionChange: (dir: Direction) => void;
}

const Controls: React.FC<ControlsProps> = ({ status, onStart, onPause, onRestart, onDirectionChange }) => {
  
  const btnBase = "p-4 rounded-full bg-gray-800 border border-gray-600 active:bg-neon-blue active:border-neon-blue active:text-black transition-all duration-150 shadow-lg";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      
      {/* Primary Actions */}
      <div className="flex gap-4">
        {status === GameStatus.IDLE || status === GameStatus.GAME_OVER ? (
          <button 
            onClick={status === GameStatus.GAME_OVER ? onRestart : onStart}
            className="flex items-center gap-2 px-8 py-3 bg-neon-blue text-black font-bold font-mono rounded shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] transition-all"
          >
            {status === GameStatus.GAME_OVER ? <RotateCcw size={20}/> : <Play size={20}/>}
            {status === GameStatus.GAME_OVER ? "RESTART" : "START"}
          </button>
        ) : (
          <button 
            onClick={status === GameStatus.PAUSED ? onStart : onPause}
            className="flex items-center gap-2 px-8 py-3 bg-yellow-400 text-black font-bold font-mono rounded shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:bg-yellow-300 transition-all"
          >
            {status === GameStatus.PAUSED ? <Play size={20}/> : <Pause size={20}/>}
            {status === GameStatus.PAUSED ? "RESUME" : "PAUSE"}
          </button>
        )}
      </div>

      {/* D-Pad for Mobile */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button className={btnBase} onClick={() => onDirectionChange(Direction.UP)} aria-label="Up">
          <ArrowUp size={24} />
        </button>
        <div />
        
        <button className={btnBase} onClick={() => onDirectionChange(Direction.LEFT)} aria-label="Left">
          <ArrowLeft size={24} />
        </button>
        <div className="w-12 h-12 rounded-full bg-gray-900/50 flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-600 rounded-full" />
        </div>
        <button className={btnBase} onClick={() => onDirectionChange(Direction.RIGHT)} aria-label="Right">
          <ArrowRight size={24} />
        </button>

        <div />
        <button className={btnBase} onClick={() => onDirectionChange(Direction.DOWN)} aria-label="Down">
          <ArrowDown size={24} />
        </button>
        <div />
      </div>

      <div className="text-xs text-gray-500 hidden md:block font-mono">
        Use WASD or ARROW keys to move
      </div>
    </div>
  );
};

export default Controls;