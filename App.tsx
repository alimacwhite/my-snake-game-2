import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Direction, 
  Coordinate, 
  GameStatus, 
  CommentaryMessage,
  Difficulty
} from './types';
import { 
  BOARD_SIZE, 
  INITIAL_SNAKE, 
  INITIAL_DIRECTION, 
  MIN_SPEED,
  KEY_MAP,
  DIFFICULTY_CONFIG
} from './constants';
import { useInterval } from './hooks/useInterval';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import CommentaryPanel from './components/CommentaryPanel';
import { generateGameCommentary } from './services/geminiService';
import { Trophy, Zap, Gauge } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [snake, setSnake] = useState<Coordinate[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Coordinate>({ x: 5, y: 5 });
  // 'direction' state is primarily for UI updates if needed, logic relies on Ref
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Difficulty State
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [speed, setSpeed] = useState(DIFFICULTY_CONFIG[Difficulty.MEDIUM].initialSpeed);
  
  const [messages, setMessages] = useState<CommentaryMessage[]>([]);
  
  // Refs
  // directionRef ensures the game loop always has the latest input without closure staleness
  const directionRef = useRef(INITIAL_DIRECTION);

  // --- Helpers ---

  const addMessage = useCallback((text: string, sender: 'ai' | 'system') => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: Date.now()
    }]);
  }, []);

  const generateFood = useCallback((currentSnake: Coordinate[]): Coordinate => {
    let newFood: Coordinate;
    let isColliding;
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      isColliding = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
    } while (isColliding);
    return newFood;
  }, []);

  const triggerAI = async (event: 'start' | 'eat' | 'die' | 'highscore', currentScore: number) => {
    const comment = await generateGameCommentary(currentScore, event, highScore);
    if (comment) {
      addMessage(comment, 'ai');
    }
  };

  // --- Input Handling (Refactored) ---

  const handleDirectionInput = useCallback((targetDir: Direction) => {
    const currentDir = directionRef.current;
    
    // Prevent 180-degree turns
    const isOpposite = 
      (targetDir === Direction.UP && currentDir === Direction.DOWN) ||
      (targetDir === Direction.DOWN && currentDir === Direction.UP) ||
      (targetDir === Direction.LEFT && currentDir === Direction.RIGHT) ||
      (targetDir === Direction.RIGHT && currentDir === Direction.LEFT);

    // Only update if valid and different (though same direction is harmless)
    if (!isOpposite) {
      setDirection(targetDir);
      directionRef.current = targetDir;
    }
  }, []);

  // --- Calculations ---
  
  const speedProgress = useMemo(() => {
    const start = DIFFICULTY_CONFIG[difficulty].initialSpeed;
    const min = MIN_SPEED;
    const range = start - min;
    const current = start - speed;
    const percent = (current / range) * 100;
    return Math.min(100, Math.max(0, percent));
  }, [speed, difficulty]);

  // --- Game Loop Logic ---

  const startGame = () => {
    // Reset Game State
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setSpeed(DIFFICULTY_CONFIG[difficulty].initialSpeed);
    setStatus(GameStatus.PLAYING);
    setFood(generateFood(INITIAL_SNAKE));
    setMessages([]); 
    
    addMessage(`System: Game Started (${difficulty} Mode)`, "system");
    triggerAI('start', 0);
  };

  const pauseGame = () => {
    if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED);
    else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
  };

  const gameOver = () => {
    setStatus(GameStatus.GAME_OVER);
    const isNewHigh = score > highScore;
    if (isNewHigh) {
      setHighScore(score);
      localStorage.setItem('neonSnakeHighScore', score.toString());
      triggerAI('highscore', score);
    } else {
      triggerAI('die', score);
    }
  };

  const moveSnake = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      // Move Head
      switch (directionRef.current) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Check Walls
      if (
        newHead.x < 0 || 
        newHead.x >= BOARD_SIZE || 
        newHead.y < 0 || 
        newHead.y >= BOARD_SIZE
      ) {
        gameOver();
        return prevSnake;
      }

      // Check Self Collision
      if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check Food Collision
      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        setFood(generateFood(newSnake));
        
        // Update Speed
        const decrement = DIFFICULTY_CONFIG[difficulty].speedDecrement;
        setSpeed(prev => Math.max(MIN_SPEED, prev - decrement));
        
        // AI Comment (throttled)
        if (newScore % 50 === 0 && newScore > 0) {
             triggerAI('eat', newScore);
        }
      } else {
        newSnake.pop(); // Remove tail if no food eaten
      }

      return newSnake;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, food, score, generateFood, highScore, difficulty]); 
  // Dependency note: functions like gameOver/triggerAI are omitted to avoid cycles, 
  // relying on `status` to control execution flow.

  // --- Effects ---

  // Game Loop
  useInterval(moveSnake, status === GameStatus.PLAYING ? speed : null);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetDir = KEY_MAP[e.key];
      if (targetDir) {
        handleDirectionInput(targetDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirectionInput]);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('neonSnakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col md:flex-row items-center justify-center p-4 gap-8">
      
      {/* Left Column: Game Area */}
      <div className="flex flex-col items-center gap-4 w-full md:w-auto">
        
        {/* Header / Score */}
        <div className="w-full flex justify-between items-center px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">Score</span>
            <span className="text-3xl font-mono font-bold text-neon-blue">{score}</span>
          </div>
          
          <div className="flex items-center gap-2">
             <h1 className="hidden md:block text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink">
              NEON SNAKE
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs text-yellow-500 font-mono uppercase tracking-widest">
              <Trophy size={12} /> High Score
            </div>
            <span className="text-2xl font-mono font-bold text-white">{highScore}</span>
          </div>
        </div>

        {/* Speed Indicator */}
        <div className="w-full flex items-center gap-3 px-2 py-1">
             <div className="flex items-center gap-2 w-16">
                <Gauge size={14} className={DIFFICULTY_CONFIG[difficulty].color} />
                <span className={`text-xs font-mono font-bold ${DIFFICULTY_CONFIG[difficulty].color}`}>
                  {DIFFICULTY_CONFIG[difficulty].label}
                </span>
             </div>
             
             <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-[0_0_10px_currentColor]"
                  style={{ width: `${Math.max(5, speedProgress)}%` }}
                />
             </div>
             
             <div className="w-12 text-right text-[10px] text-gray-500 font-mono">
                {Math.round(speedProgress)}% MAX
             </div>
        </div>

        <GameBoard snake={snake} food={food} status={status} />

        <Controls 
          status={status}
          difficulty={difficulty}
          onStart={startGame}
          onPause={pauseGame}
          onRestart={startGame}
          onDirectionChange={handleDirectionInput}
          onDifficultyChange={setDifficulty}
        />
      </div>

      {/* Right Column: AI Commentary */}
      <div className="w-full md:w-auto flex flex-col gap-4">
         <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="flex items-center gap-2 font-mono font-bold text-neon-green mb-2">
               <Zap size={18} /> POWERED BY GEMINI
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              NeonBit watches your gameplay and reacts in real-time using the Google Gemini API. 
              Try to impress it!
            </p>
         </div>
         <CommentaryPanel messages={messages} />
      </div>

    </div>
  );
};

export default App;