import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "../slices/settingsSlice";
import gameReducer from "../slices/gameSlice";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    game: gameReducer,
  },
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
