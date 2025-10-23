import { useAppDispatch, useAppSelector } from "../hooks/redux";
import Menu from "../components/Menu";
import GameCanvas from "../components/GameCanvas";
import { getPalette } from "../utils/colors";
import { setStatus, setDots, setStarted } from "../slices/gameSlice";
import { genDots } from "../utils/gameGen";

export default function App() {
  const settings = useAppSelector((s) => s.settings);
  const game = useAppSelector((s) => s.game);
  const dispatch = useAppDispatch();
  const colors = getPalette(settings.colorsCount);

  const restartSameSeed = () => {
    const seed = settings.seed ?? Math.floor(Math.random() * 1e9);
    const w = Math.max(640, window.innerWidth);
    const h = Math.max(480, window.innerHeight * 0.7);
    dispatch(
      setDots(genDots(seed, settings.colorsCount, settings.dotsPerColor, w, h))
    );
    dispatch(setStarted());
  };

  return (
    <div className="min-h-full flex flex-col gap-6 p-6">
      {game.status === "menu" && <Menu />}

      {game.status !== "menu" && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">
              Time:{" "}
              <span className="tabular-nums">{game.elapsed.toFixed(2)}s</span>
            </div>
            <div className="flex gap-2">
              {colors.map((c, i) => (
                <span
                  key={i}
                  className="w-4 h-4 rounded-full"
                  style={{ background: c }}
                />
              ))}
            </div>
            <button
              onClick={() => dispatch(setStatus("menu"))}
              className="px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition cursor-pointer"
            >
              Menu
            </button>
          </div>

          <GameCanvas colors={colors} speed={settings.speed} />

          {game.status === "won" && (
            <div className="mx-auto text-center space-y-3">
              <div className="text-3xl font-bold">
                You sorted the dots in {game.elapsed.toFixed(2)} seconds
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={restartSameSeed}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-900 hover:opacity-80 transition font-semibold cursor-pointer"
                >
                  Restart
                </button>
                <button
                  onClick={() => dispatch(setStatus("menu"))}
                  className="px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition font-semibold cursor-pointer"
                >
                  Change settings
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
