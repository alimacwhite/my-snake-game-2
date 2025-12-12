import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, 
  Direction, 
  Coordinate, 
  GameStatus, 
  CommentaryMessage 
} from './types';
import { 
  BOARD_SIZE, 
  INITIAL_SNAKE, 
  INITIAL_DIRECTION, 
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_DECREMENT,
  KEY_MAP
} from './constants';
import { useInterval } from './hooks/useInterval';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import CommentaryPanel from './components/CommentaryPanel';
import { generateGameCommentary } from './services/geminiService';
import { Trophy, Zap } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [snake, setSnake] = useState<Coordinate[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Coordinate>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const [messages, setMessages] = useState<CommentaryMessage[]>([]);
  
  // Refs to prevent closure staleness in event listeners if needed, 
  // though we mostly rely on state for rendering.
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
    // Optimistic UI update or placeholder could go here
    const comment = await generateGameCommentary(currentScore, event, highScore);
    if (comment) {
      addMessage(comment, 'ai');
    }
  };

  // --- Game Loop Logic ---

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setStatus(GameStatus.PLAYING);
    setFood(generateFood(INITIAL_SNAKE));
    setMessages([]); // Clear chat on new game? Or keep history? Let's clear.
    addMessage("System: Game Started", "system");
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

      // Check Food
      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        setFood(generateFood(newSnake));
        setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_DECREMENT));
        
        // Random chance for AI comment on eat, or every 50 points
        if (newScore % 50 === 0 && newScore > 0) {
             triggerAI('eat', newScore);
        }
      } else {
        newSnake.pop(); // Remove tail
      }

      return newSnake;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, food, score, generateFood, highScore]); 
  // removed 'gameOver' and 'triggerAI' from deps to avoid circular logic in simple implementation
  // relying on closure for functional updates mostly.

  // --- Effects ---

  // Game Loop
  useInterval(moveSnake, status === GameStatus.PLAYING ? speed : null);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetDir = KEY_MAP[e.key];
      if (!targetDir) return;

      const currentDir = directionRef.current;
      
      // Prevent 180 degree turns
      const isOpposite = 
        (targetDir === Direction.UP && currentDir === Direction.DOWN) ||
        (targetDir === Direction.DOWN && currentDir === Direction.UP) ||
        (targetDir === Direction.LEFT && currentDir === Direction.RIGHT) ||
        (targetDir === Direction.RIGHT && currentDir === Direction.LEFT);

      if (!isOpposite) {
        setDirection(targetDir);
        directionRef.current = targetDir;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('neonSnakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // --- Handlers ---
  const handleDirectionChange = (newDir: Direction) => {
      const currentDir = directionRef.current;
      const isOpposite = 
        (newDir === Direction.UP && currentDir === Direction.DOWN) ||
        (newDir === Direction.DOWN && currentDir === Direction.UP) ||
        (newDir === Direction.LEFT && currentDir === Direction.RIGHT) ||
        (newDir === Direction.RIGHT && currentDir === Direction.LEFT);
      
      if (!isOpposite) {
        setDirection(newDir);
        directionRef.current = newDir;
      }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col md:flex-row items-center justify-center p-4 gap-8">
      
      {/* Left Column: Game Area */}
      <div className="flex flex-col items-center gap-6 w-full md:w-auto">
        
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

        <GameBoard snake={snake} food={food} status={status} />

        <Controls 
          status={status}
          onStart={startGame}
          onPause={pauseGame}
          onRestart={startGame}
          onDirectionChange={handleDirectionChange}
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