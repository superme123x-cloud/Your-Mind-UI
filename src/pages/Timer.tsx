import { useState, useEffect, useRef } from 'react';
import { pomodoroApi, projectsApi, tasksApi } from '../api/client';
import type { Project, Task } from '../api/types';
import { Play, Pause, RotateCcw, Minimize2 } from 'lucide-react';

const PRESETS = [15, 25, 45, 60];

// ========== Flip Digit (يدعم Pause/Resume) ==========
function FlipDigit({ value }: { value: string }) {
  const [current, setCurrent] = useState(value);
  const [next, setNext] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== current) {
      setNext(value);
      setFlipping(true);
      const t = setTimeout(() => {
        setCurrent(value);
        setFlipping(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [value, current]);

  return (
    <div className="flip-card">
      {/* Top static */}
      <div className="flip-half flip-half-top">
        <span className="flip-num">{flipping ? next : current}</span>
      </div>

      {/* Bottom static */}
      <div className="flip-half flip-half-bottom">
        <span className="flip-num">{current}</span>
      </div>

      {/* Flip top (الرقم القديم بيسقط) */}
      {flipping && (
        <div className="flip-half flip-half-top flip-top-anim">
          <span className="flip-num">{current}</span>
        </div>
      )}

      {/* Flip bottom (الرقم الجديد بيطلع) */}
      {flipping && (
        <div className="flip-half flip-half-bottom flip-bottom-anim">
          <span className="flip-num">{next}</span>
        </div>
      )}

      {/* Line */}
      <div className="flip-divider" />
    </div>
  );
}

// ========== أصوات ==========
const playTickSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
};

const playStartSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [660, 880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  } catch {}
};

const playVictorySound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [
      { f: 523.25, t: 0.0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.30, d: 0.15 },
      { f: 1046.5, t: 0.45, d: 0.6 },
    ].forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = f;
      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + d);
      osc.start(start);
      osc.stop(start + d);
    });
  } catch {}
};

// ========== Main Timer ==========
export default function Timer() {
  const [minutes, setMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [justFinished, setJustFinished] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const [p, t] = await Promise.all([projectsApi.list(), tasksApi.today()]);
        setProjects(p.data);
        const allTasks = (t.data as { tasks: Task[] }).tasks;
        setTasks(allTasks.filter((x) => !x.isCompleted));
      } catch (err) { console.error(err); }
    })();
  }, []);

  // Timer - بيتحكم فيه كامل
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      handleComplete();
      return;
    }
    const i = setInterval(() => {
      setSecondsLeft((s) => {
        const newVal = s - 1;
        if (newVal <= 10 && newVal > 0 && newVal !== lastTickRef.current) {
          playTickSound();
          lastTickRef.current = newVal;
        }
        return newVal;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [isRunning, secondsLeft]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      }
    } catch {}
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const handleStartStop = async () => {
    if (!isRunning) {
      if (secondsLeft === minutes * 60) playStartSound();
      await enterFullscreen();
    }
    setIsRunning(!isRunning);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    setJustFinished(true);
    playVictorySound();
    setSaving(true);
    try {
      await pomodoroApi.complete({
        taskId: selectedTaskId,
        projectId: selectedProjectId,
        activityType: 'focus',
        durationMinutes: minutes,
      });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
    setTimeout(() => setJustFinished(false), 3000);
    setSecondsLeft(minutes * 60);
  };

  const setPreset = (m: number) => {
    setMinutes(m);
    setSecondsLeft(m * 60);
    setIsRunning(false);
    lastTickRef.current = 0;
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(minutes * 60);
    lastTickRef.current = 0;
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const totalSeconds = minutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const minTens = String(mins).padStart(2, '0')[0];
  const minOnes = String(mins).padStart(2, '0')[1];
  const secTens = String(secs).padStart(2, '0')[0];
  const secOnes = String(secs).padStart(2, '0')[1];

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-bg-dark"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          className="absolute top-6 right-6 p-3 rounded-xl bg-card border border-border-teal text-gray-400 hover:text-accent hover:border-accent transition-all z-10"
        >
          <Minimize2 size={18} />
        </button>
      )}

      {justFinished && (
        <div className="absolute inset-0 bg-bg-dark/90 backdrop-blur-md flex items-center justify-center z-40">
          <div className="text-center animate-pulse">
            <div className="text-9xl mb-6">🏆</div>
            <h2 className="text-5xl font-bold text-accent mb-3">أحسنت!</h2>
            <p className="text-gray-400 text-lg">خلصت جلسة {minutes} دقيقة</p>
          </div>
        </div>
      )}

      {!isFullscreen && (
  <div className="flex gap-3 mb-12 z-10 flex-wrap justify-center items-center">
    {PRESETS.map((m) => (
      <button
        key={m}
        onClick={() => setPreset(m)}
        disabled={isRunning}
        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
          minutes === m
            ? 'bg-accent text-bg-dark border-accent shadow-glow'
            : 'bg-card text-gray-400 border-border-teal hover:border-accent hover:text-accent'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {m} دقيقة
      </button>
    ))}

    {/* Custom input */}
    <div className="flex items-center gap-2 bg-card border border-border-teal rounded-xl px-3 py-1.5 focus-within:border-accent transition-all">
      <input
        type="number"
        min={1}
        max={999}
        value={customMinutes}
        onChange={(e) => setCustomMinutes(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = parseInt(customMinutes);
            if (val >= 1 && val <= 999) {
              setPreset(val);
              setCustomMinutes('');
            }
          }
        }}
        disabled={isRunning}
        placeholder="أي رقم"
        className="w-20 bg-transparent text-white text-sm outline-none text-center placeholder-gray-600 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => {
          const val = parseInt(customMinutes);
          if (val >= 1 && val <= 999) {
            setPreset(val);
            setCustomMinutes('');
          }
        }}
        disabled={isRunning || !customMinutes || parseInt(customMinutes) < 1}
        className="text-accent hover:text-accent-glow disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>
  </div>
)}

      {/* Flip Clock */}
      <div className="flex items-center gap-3 md:gap-4 mb-14 z-10" dir="ltr">
        <div className="flex gap-2">
          <FlipDigit value={minTens} />
          <FlipDigit value={minOnes} />
        </div>

        <div className="flex flex-col gap-3 mx-2 md:mx-3">
          <div className={`w-3 h-3 rounded-full bg-accent ${isRunning ? 'animate-pulse' : ''}`} />
          <div className={`w-3 h-3 rounded-full bg-accent ${isRunning ? 'animate-pulse' : ''}`} />
        </div>

        <div className="flex gap-2">
          <FlipDigit value={secTens} />
          <FlipDigit value={secOnes} />
        </div>
      </div>

      <div className="w-full max-w-md h-2 bg-card rounded-full overflow-hidden border border-border-teal mb-10 z-10">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-glow transition-all duration-1000 shadow-glow"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-4 mb-10 z-10">
        <button
          onClick={handleStartStop}
          disabled={saving}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent-glow text-bg-dark flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isRunning ? <Pause size={36} /> : <Play size={36} className="mr-1" />}
        </button>
        <button
          onClick={handleReset}
          className="w-24 h-24 rounded-full bg-card border border-border-teal text-gray-400 hover:text-accent hover:border-accent flex items-center justify-center transition-all"
        >
          <RotateCcw size={26} />
        </button>
      </div>

      {!isFullscreen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg z-10">
          <select
            value={selectedProjectId ?? ''}
            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
            disabled={isRunning}
            className="px-4 py-3 bg-card border border-border-teal rounded-xl text-white text-sm outline-none focus:border-accent disabled:opacity-50"
          >
            <option value="">بدون مشروع</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={selectedTaskId ?? ''}
            onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
            disabled={isRunning}
            className="px-4 py-3 bg-card border border-border-teal rounded-xl text-white text-sm outline-none focus:border-accent disabled:opacity-50"
          >
            <option value="">بدون مهمة</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      )}

      {saving && <p className="text-accent text-sm mt-4 z-10">جاري الحفظ...</p>}
    </div>
  );
}