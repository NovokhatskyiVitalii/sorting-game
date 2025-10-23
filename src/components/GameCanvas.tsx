import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { setDots, setElapsed, win } from "../slices/gameSlice";
import { checkWin } from "../utils/gameGen";

type Props = { colors: string[]; speed: number };

const R = 8;
const MOUSE_R = 48;
const FORCE = 0.2;
const FRICTION = 0.99;
const MAX_SPEED = 3.2;
const WALL_RESTITUTION = 0.21;

const PADDING = 2;
const SEP_ITERS = 2;
const SEP_FORCE = 0.6;

export default function GameCanvas({ colors, speed }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const dprRef = useRef(1);
  const mouse = useRef({ x: 0, y: 0, down: false, moved: false });

  const { dots, startedAt, status, elapsed } = useAppSelector((s) => s.game);
  const { colorsCount } = useAppSelector((s) => s.settings);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      dprRef.current = dpr;
      const w = c.clientWidth,
        h = c.clientHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(c);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const c = ref.current!;
    const getPos = (clientX: number, clientY: number) => {
      const rect = c.getBoundingClientRect();
      mouse.current.x = clientX - rect.left;
      mouse.current.y = clientY - rect.top;
      mouse.current.moved = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      c.setPointerCapture?.(e.pointerId);
      getPos(e.clientX, e.clientY);
      mouse.current.down = true;
      e.preventDefault();
    };
    const onPointerMove = (e: PointerEvent) => {
      getPos(e.clientX, e.clientY);
      if (mouse.current.down) e.preventDefault();
    };
    const onPointerEnd = (e: PointerEvent) => {
      mouse.current.down = false;
      c.releasePointerCapture?.(e.pointerId);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length) {
        const t = e.touches[0];
        getPos(t.clientX, t.clientY);
        mouse.current.down = true;
        e.preventDefault();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length) {
        const t = e.touches[0];
        getPos(t.clientX, t.clientY);
        e.preventDefault();
      }
    };
    const onTouchEnd = () => {
      mouse.current.down = false;
    };
    const onMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
      mouse.current.moved = true;
    };
    const onDown = () => (mouse.current.down = true);
    const onUp = () => (mouse.current.down = false);

    const passiveFalse: AddEventListenerOptions & EventListenerOptions = {
      passive: false,
    };

    c.addEventListener("pointerdown", onPointerDown, passiveFalse);
    c.addEventListener("pointermove", onPointerMove, passiveFalse);
    c.addEventListener("pointerup", onPointerEnd);
    c.addEventListener("pointercancel", onPointerEnd);
    c.addEventListener("pointerleave", onPointerEnd);

    c.addEventListener("touchstart", onTouchStart, passiveFalse);
    c.addEventListener("touchmove", onTouchMove, passiveFalse);
    c.addEventListener("touchend", onTouchEnd);

    c.addEventListener("mousemove", onMove);
    c.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      // Pointer
      c.removeEventListener("pointerdown", onPointerDown, passiveFalse);
      c.removeEventListener("pointermove", onPointerMove, passiveFalse);
      c.removeEventListener("pointerup", onPointerEnd);
      c.removeEventListener("pointercancel", onPointerEnd);
      c.removeEventListener("pointerleave", onPointerEnd);
      // Touch
      c.removeEventListener("touchstart", onTouchStart, passiveFalse);
      c.removeEventListener("touchmove", onTouchMove, passiveFalse);
      c.removeEventListener("touchend", onTouchEnd);
      // Mouse
      c.removeEventListener("mousemove", onMove);
      c.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const c = ref.current!;
      const ctx = c.getContext("2d")!;
      const w = c.clientWidth,
        h = c.clientHeight;

      if (status === "playing") {
        const m = mouse.current;

        const next = dots.map((d) => {
          let x = d.x,
            y = d.y,
            vx = d.vx,
            vy = d.vy;

          const dx = x - m.x,
            dy = y - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_R) {
            const k = ((MOUSE_R - dist) / MOUSE_R) * FORCE * speed;
            const nx = dx / (dist || 1),
              ny = dy / (dist || 1);
            vx += nx * k;
            vy += ny * k;
          }

          x += vx;
          y += vy;

          {
            const sp = Math.hypot(vx, vy);
            if (sp > MAX_SPEED) {
              const k = MAX_SPEED / sp;
              vx *= k;
              vy *= k;
            }
          }

          vx *= FRICTION;
          vy *= FRICTION;

          if (x < R) {
            x = R;
            vx *= -WALL_RESTITUTION;
          }
          if (y < R) {
            y = R;
            vy *= -WALL_RESTITUTION;
          }
          if (x > w - R) {
            x = w - R;
            vx *= -WALL_RESTITUTION;
          }
          if (y > h - R) {
            y = h - R;
            vy *= -WALL_RESTITUTION;
          }

          return { ...d, x, y, vx, vy };
        });

        for (let iter = 0; iter < SEP_ITERS; iter++) {
          for (let i = 0; i < next.length; i++) {
            for (let j = i + 1; j < next.length; j++) {
              const a = next[i],
                b = next[j];
              const dx = b.x - a.x,
                dy = b.y - a.y;
              const dist = Math.hypot(dx, dy);
              const minDist = 2 * R + PADDING;

              if (dist > 0 && dist < minDist) {
                const nx = dx / dist,
                  ny = dy / dist;
                const overlap = minDist - dist;
                const push = overlap * 0.5 * SEP_FORCE;

                a.x -= nx * push;
                a.y -= ny * push;
                b.x += nx * push;
                b.y += ny * push;

                const avn = a.vx * nx + a.vy * ny;
                const bvn = b.vx * nx + b.vy * ny;
                const damp = 0.3;
                const imp = (bvn - avn) * 0.5 * damp;
                a.vx += imp * nx;
                a.vy += imp * ny;
                b.vx -= imp * nx;
                b.vy -= imp * ny;
              }
            }
          }
        }

        dispatch(setDots(next));

        if (startedAt) {
          dispatch(setElapsed((performance.now() - startedAt) / 1000));
        }

        if (checkWin(next, colorsCount)) {
          const final = startedAt ? (performance.now() - startedAt) / 1000 : 0;
          dispatch(setElapsed(final));
          dispatch(win());
        }
      }

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 140px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(Math.floor(elapsed)), w / 2, h / 2);
      ctx.restore();

      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, R, 0, Math.PI * 2);
        ctx.fillStyle = colors[d.c % colors.length];
        ctx.fill();
      }

      const m = mouse.current;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.x - 6, m.y);
      ctx.lineTo(m.x + 6, m.y);
      ctx.moveTo(m.x, m.y - 6);
      ctx.lineTo(m.x, m.y + 6);
      ctx.stroke();
      ctx.restore();
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dots, status, startedAt, elapsed, colors, speed, colorsCount, dispatch]);

  return (
    <canvas
      ref={ref}
      className="w-full h-[70vh] rounded-2xl bg-zinc-800 shadow-lg touch-none select-none"
    />
  );
}
