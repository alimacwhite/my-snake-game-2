import { Coordinate, Direction, Difficulty } from './types';

export const BOARD_SIZE = 20; // 20x20 Grid
export const MIN_SPEED = 40; // Max speed (lower ms)

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: { label: 'EASY', initialSpeed: 200, speedDecrement: 2, color: 'text-green-400', borderColor: 'border-green-400' },
  [Difficulty.MEDIUM]: { label: 'MEDIUM', initialSpeed: 140, speedDecrement: 4, color: 'text-yellow-400', borderColor: 'border-yellow-400' },
  [Difficulty.HARD]: { label: 'HARD', initialSpeed: 90, speedDecrement: 6, color: 'text-red-500', borderColor: 'border-red-500' },
};

export const INITIAL_SNAKE: Coordinate[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

export const INITIAL_DIRECTION = Direction.UP;

export const KEY_MAP: Record<string, Direction> = {
  ArrowUp: Direction.UP,
  w: Direction.UP,
  ArrowDown: Direction.DOWN,
  s: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  a: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  d: Direction.RIGHT,
};