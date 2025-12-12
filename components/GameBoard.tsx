import React, { useMemo } from 'react';
import { Coordinate, GameStatus } from '../types';
import { BOARD_SIZE } from '../constants';

interface GameBoardProps {
  snake: Coordinate[];
  food: Coordinate;
  status: GameStatus;
}

const GameBoard: React.FC<GameBoardProps> = ({ snake, food, status }) => {
  
  // Create grid cells
  const grid = useMemo(() => {
    const cells = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }, []);

  const isSnakeBody = (x: number, y: number) => {
    return snake.some(segment => segment.x === x && segment.y === y);
  };

  const isSnakeHead = (x: number, y: number) => {
    return snake[0]?.x === x && snake[0]?.y === y;
  };

  const isFood = (x: number, y: number) => {
    return food.x === x && food.y === y;
  };

  return (
    <div className="relative p-1 bg-neon-grid rounded-xl border-4 border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.3)]">
      
      {/* Overlay for Game States */}
      {status !== GameStatus.PLAYING && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg text-white">
          {status === GameStatus.IDLE && (
            <div className="text-center animate-pulse">
              <h2 className="text-4xl font-mono font-bold text-neon-pink mb-4">READY?</h2>
              <p className="text-gray-300">Press Arrow Keys or Start</p>
            </div>
          )}
          {status === GameStatus.GAME_OVER && (
            <div className="text-center">
              <h2 className="text-5xl font-mono font-bold text-red-500 mb-2">GAME OVER</h2>
              <p className="text-gray-300 mb-6">Press Restart to try again</p>
            </div>
          )}
           {status === GameStatus.PAUSED && (
            <div className="text-center">
              <h2 className="text-4xl font-mono font-bold text-yellow-400 mb-2">PAUSED</h2>
            </div>
          )}
        </div>
      )}

      {/* The Grid */}
      <div 
        className="grid gap-px bg-gray-900" 
        style={{ 
          gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          width: 'min(80vw, 500px)',
          height: 'min(80vw, 500px)'
        }}
      >
        {grid.map((cell) => {
          const isHead = isSnakeHead(cell.x, cell.y);
          const isBody = isSnakeBody(cell.x, cell.y);
          const isFoodCell = isFood(cell.x, cell.y);

          let cellClass = "w-full h-full bg-black/40 transition-colors duration-75";

          if (isHead) {
            cellClass = "bg-neon-green shadow-[0_0_15px_#00ff00] z-10 rounded-sm";
          } else if (isBody) {
            cellClass = "bg-green-600/80 rounded-sm";
          } else if (isFoodCell) {
            cellClass = "bg-neon-pink shadow-[0_0_15px_#ff00ff] rounded-full animate-pulse-fast";
          }

          return (
            <div 
              key={`${cell.x}-${cell.y}`} 
              className={cellClass}
            />
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;