export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface GameState {
  snake: Coordinate[];
  food: Coordinate;
  direction: Direction;
  score: number;
  highScore: number;
  status: GameStatus;
  speed: number;
}

export interface CommentaryMessage {
  id: string;
  text: string;
  sender: 'ai' | 'system';
  timestamp: number;
}