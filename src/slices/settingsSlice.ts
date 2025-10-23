import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type Settings = {
  seed: number | null;
  colorsCount: number;
  dotsPerColor: number;
  speed: number;
};

const initialState: Settings = {
  seed: null,
  colorsCount: 3,
  dotsPerColor: 6,
  speed: 1.0,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSettings: (s, a: PayloadAction<Partial<Settings>>) =>
      Object.assign(s, a.payload),
    setSeed: (s, a: PayloadAction<number | null>) => {
      s.seed = a.payload;
    },
  },
});

export const { setSettings, setSeed } = settingsSlice.actions;
export default settingsSlice.reducer;
