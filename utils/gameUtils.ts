import { Coordinate } from '../types';
import { BOARD_SIZE } from '../constants';

export const areCoordsEqual = (c1: Coordinate, c2: Coordinate): boolean => {
  return c1.x === c2.x && c1.y === c2.y;
};

export const generateFood = (snake: Coordinate[]): Coordinate => {
  let newFood: Coordinate;
  let isColliding;
  do {
    newFood = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE)
    };
    isColliding = snake.some(segment => areCoordsEqual(segment, newFood));
  } while (isColliding);
  return newFood;
};