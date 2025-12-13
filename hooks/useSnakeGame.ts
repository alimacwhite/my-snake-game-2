import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Coordinate, 
  Direction, 
  GameStatus, 
  Difficulty, 
  GameEventType 
} from '../types';
import { 
  BOARD_SIZE, 
  INITIAL_SNAKE, 
  INITIAL_DIRECTION, 
  MIN_SPEED, 
  DIFFICULTY_CONFIG,
  KEY_MAP
} from '../constants';
import { useInterval } from './useInterval';
import { generateFood, areCoordsEqual } from '../utils/gameUtils';

export const useSnakeGame = (onEvent: (type: GameEventType, score: number, highScore: number) => void) => {
  // State
  const [snake, setSnake] = useState<Coordinate[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Coordinate>({ x: 5, y: 5 });
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [speed, setSpeed] = useState(DIFFICULTY_CONFIG[Difficulty.MEDIUM].initialSpeed);

  // Refs for logic (avoids stale closures in interval)
  const directionRef = useRef(INITIAL_DIRECTION);
  // Track the direction actually executed in the last frame to prevent fast-turn suicide
  const lastMoveDirectionRef = useRef(INITIAL_DIRECTION);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('neonSnakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // --- Internal Actions ---

  const gameOver = useCallback(() => {
    setStatus(GameStatus.GAME_OVER);
    const isNewHigh = score > highScore;
    let newHighScore = highScore;
    
    if (isNewHigh) {
      newHighScore = score;
      setHighScore(score);
      localStorage.setItem('neonSnakeHighScore', score.toString());
      onEvent('highscore', score, newHighScore);
    } else {
      onEvent('die', score, newHighScore);
    }
  }, [score, highScore, onEvent]);

  // --- Public Actions ---

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    lastMoveDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setSpeed(DIFFICULTY_CONFIG[difficulty].initialSpeed);
    setStatus(GameStatus.PLAYING);
    setFood(generateFood(INITIAL_SNAKE));
    onEvent('start', 0, highScore);
  }, [difficulty, onEvent, highScore]);

  const pauseGame = useCallback(() => {
    if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED);
    else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
  }, [status]);

  const handleDirectionInput = useCallback((targetDir: Direction) => {
    // Validate against the last *processed* direction, not the current ref
    // This prevents the user from queuing a 180-degree turn within a single tick
    const currentDir = lastMoveDirectionRef.current;
    
    const isOpposite = 
      (targetDir === Direction.UP && currentDir === Direction.DOWN) ||
      (targetDir === Direction.DOWN && currentDir === Direction.UP) ||
      (targetDir === Direction.LEFT && currentDir === Direction.RIGHT) ||
      (targetDir === Direction.RIGHT && currentDir === Direction.LEFT);

    if (!isOpposite) {
      directionRef.current = targetDir;
    }
  }, []);

  // --- Game Loop ---

  const moveSnake = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    // Lock in the move direction for this frame
    lastMoveDirectionRef.current = directionRef.current;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Wall Collision
      if (newHead.x < 0 || newHead.x >= BOARD_SIZE || newHead.y < 0 || newHead.y >= BOARD_SIZE) {
        gameOver();
        return prevSnake;
      }

      // Self Collision
      if (prevSnake.some(seg => areCoordsEqual(seg, newHead))) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food Collision
      if (areCoordsEqual(newHead, food)) {
        const newScore = score + 10;
        setScore(newScore);
        setFood(generateFood(newSnake));
        
        const decrement = DIFFICULTY_CONFIG[difficulty].speedDecrement;
        setSpeed(prev => Math.max(MIN_SPEED, prev - decrement));
        
        if (newScore % 50 === 0 && newScore > 0) {
          onEvent('eat', newScore, highScore);
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [status, food, score, difficulty, gameOver, onEvent, highScore]);

  useInterval(moveSnake, status === GameStatus.PLAYING ? speed : null);

  // --- Keyboard Listeners ---
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetDir = KEY_MAP[e.key];
      if (targetDir) handleDirectionInput(targetDir);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirectionInput]);

  // --- Computed ---

  const speedProgress = useMemo(() => {
    const start = DIFFICULTY_CONFIG[difficulty].initialSpeed;
    const min = MIN_SPEED;
    const range = start - min;
    const current = start - speed;
    const percent = (current / range) * 100;
    return Math.min(100, Math.max(0, percent));
  }, [speed, difficulty]);

  return {
    state: {
      snake,
      food,
      status,
      score,
      highScore,
      difficulty,
      speedProgress
    },
    actions: {
      startGame,
      pauseGame,
      restartGame: startGame,
      setDifficulty,
      handleDirectionInput
    }
  };
};