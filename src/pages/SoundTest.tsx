import { useState } from 'react';
import { Play } from 'lucide-react';

// ========== مكتبة الأصوات ==========
const sounds = {
  // 1. كليك عادي (اللي عجبك)
  click: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(2500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  },

  // 2. كليك ناعم (Soft Click)
  softClick: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  },

  // 3. كليك مزدوج (Double Click)
  doubleClick: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [0, 0.05].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(2200, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + delay + 0.02);
      gain.gain.setValueAtTime(0.07, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.04);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.04);
    });
  },

  // 4. كليك عميق (Deep Click)
  deepClick: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  },

  // 5. كليك معدني (Metallic Click)
  metallicClick: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [1200, 2400, 3600].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      gain.gain.setValueAtTime(0.04 / (i + 1), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    });
  },

  // 6. كليك هوائي (Airy Click / Snappy)
  snappy: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(3500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.025);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  },

  // 7. كليك خفيف جدًا (Subtle Tick)
  tick: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(3000, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.02);
  },

  // 8. كليك مطاطي (Rubber Click - زي زرار كيبورد ميكانيكي)
  rubber: () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  },
};

const soundList = [
  { key: 'click', name: 'كليك عادي', desc: 'اللي عجبك', emoji: '🖱️' },
  { key: 'softClick', name: 'كليك ناعم', desc: 'أهدى وأخف', emoji: '🪶' },
  { key: 'doubleClick', name: 'كليك مزدوج', desc: 'تكتكتين سريعين', emoji: '🎯' },
  { key: 'deepClick', name: 'كليك عميق', desc: 'صوت تقيل قوي', emoji: '🔊' },
  { key: 'metallicClick', name: 'كليك معدني', desc: 'صوت حديد لامع', emoji: '⚙️' },
  { key: 'snappy', name: 'كليك هوائي', desc: 'سريع وحاد', emoji: '⚡' },
  { key: 'tick', name: 'تيك خفيف', desc: 'همسة صغيرة', emoji: '💧' },
  { key: 'rubber', name: 'كليك مطاطي', desc: 'زي كيبورد ميكانيكي', emoji: '⌨️' },
] as const;

export default function SoundTest() {
  const [selected, setSelected] = useState<string>('bell');

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">تجربة الأصوات</h1>
        <p className="text-gray-400">دوس على أي صوت تسمعه، واختار اللي يعجبك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {soundList.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              sounds[s.key]();
              setSelected(s.key);
            }}
            className={`glass-card p-5 flex items-center gap-4 text-right transition-all ${
              selected === s.key
                ? 'border-accent shadow-glow'
                : 'hover:border-accent/60'
            }`}
          >
            <div className="text-4xl">{s.emoji}</div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{s.name}</p>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              selected === s.key ? 'bg-accent text-bg-dark' : 'bg-card border border-border-teal text-gray-400'
            }`}>
              <Play size={16} className="mr-0.5" />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-8 glass-card p-6 text-center border-accent/40">
          <p className="text-gray-400 text-sm mb-2">الصوت المختار</p>
          <p className="text-2xl font-bold text-accent">
            {soundList.find((s) => s.key === selected)?.name}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            قولّي اسمه عشان أركبه في زرار إكمال المهام
          </p>
        </div>
      )}
    </div>
  );
}