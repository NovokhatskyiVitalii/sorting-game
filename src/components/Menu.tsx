import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { setSettings } from "../slices/settingsSlice";
import { setDots, setStarted, setStatus } from "../slices/gameSlice";
import { getPalette } from "../utils/colors";
import { genDots } from "../utils/gameGen";
import { randomSeed } from "../utils/seedGenerator";

export default function Menu() {
  const s = useAppSelector((st) => st.settings);
  const dispatch = useAppDispatch();

  const [local, setLocal] = useState({
    colorsCount: s.colorsCount,
    dotsPerColor: s.dotsPerColor,
    speed: s.speed,
    seedStr: s.seed ? String(s.seed) : "",
  });

  const start = () => {
    const seed = local.seedStr ? parseInt(local.seedStr, 10) : randomSeed();
    dispatch(
      setSettings({
        ...local,
        seed,
      })
    );

    const w = Math.max(640, window.innerWidth);
    const h = Math.max(480, window.innerHeight * 0.7);
    const dots = genDots(seed, local.colorsCount, local.dotsPerColor, w, h);
    dispatch(setDots(dots));
    dispatch(setStatus("playing"));
    dispatch(setStarted());
  };

  return (
    <div className="min-w-[320px] max-w-xl mx-auto p-6 bg-zinc-800/70 rounded-2xl shadow-xl space-y-5">
      <h1 className="text-2xl font-semibold">Sorting Game</h1>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-300">
          Кол-во цветов: {local.colorsCount}
        </span>
        <input
          type="range"
          min={2}
          max={6}
          step={1}
          value={local.colorsCount}
          onChange={(e) =>
            setLocal((v) => ({ ...v, colorsCount: +e.target.value }))
          }
          className="w-full accent-yellow-400 cursor-pointer"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-300">
          Кружков на цвет: {local.dotsPerColor}
        </span>
        <input
          type="range"
          min={3}
          max={20}
          step={1}
          value={local.dotsPerColor}
          onChange={(e) =>
            setLocal((v) => ({ ...v, dotsPerColor: +e.target.value }))
          }
          className="w-full accent-cyan-400 cursor-pointer"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-300">
          Интенсивность движения: {local.speed.toFixed(1)}
        </span>
        <input
          type="range"
          min={0.6}
          max={2}
          step={0.1}
          value={local.speed}
          onChange={(e) => setLocal((v) => ({ ...v, speed: +e.target.value }))}
          className="w-full accent-pink-400 cursor-pointer"
        />
      </label>

      <div className="flex items-center gap-2 text-sm text-zinc-300">
        Палитра:
        <div className="flex flex-wrap gap-1">
          {getPalette(local.colorsCount).map((col, i) => (
            <span
              key={i}
              className="w-5 h-5 rounded-full border border-white/20"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={start}
        className="px-4 py-2 rounded-xl bg-white text-zinc-900 font-semibold hover:opacity-90 transition cursor-pointer"
      >
        Play
      </button>
    </div>
  );
}
