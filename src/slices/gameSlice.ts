import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type Dot = {
  id: string;
  c: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type GameState = {
  status: "menu" | "playing" | "won";
  dots: Dot[];
  startedAt: number | null;
  elapsed: number;
};

const initialState: GameState = {
  status: "menu",
  dots: [],
  startedAt: null,
  elapsed: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setDots: (s, a: PayloadAction<Dot[]>) => {
      s.dots = a.payload;
    },
    setStatus: (s, a: PayloadAction<GameState["status"]>) => {
      s.status = a.payload;
    },
    setStarted: (s) => {
      s.startedAt = performance.now();
      s.elapsed = 0;
      s.status = "playing";
    },
    setElapsed: (s, a: PayloadAction<number>) => {
      s.elapsed = a.payload;
    },
    win: (s) => {
      s.status = "won";
      s.startedAt = null;
    },
  },
});

export const { setDots, setStatus, setStarted, setElapsed, win } =
  gameSlice.actions;
export default gameSlice.reducer;
