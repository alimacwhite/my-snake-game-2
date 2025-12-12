import { Coordinate, Direction } from './types';

export const BOARD_SIZE = 20; // 20x20 Grid
export const INITIAL_SPEED = 150; // ms
export const MIN_SPEED = 50; // Max speed (lower ms)
export const SPEED_DECREMENT = 2; // Speed up by 2ms per food

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