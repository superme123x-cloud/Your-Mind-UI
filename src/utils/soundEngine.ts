// ========== الأصوات المتاحة (كلهم ما عدا المعدني) ==========
const soundFunctions = {
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

// ========== قائمة الأصوات (بدون المعدني) ==========
const SOUND_KEYS: SoundKey[] = ['click', 'softClick', 'doubleClick', 'deepClick', 'snappy', 'tick', 'rubber'];
type SoundKey = 'click' | 'softClick' | 'doubleClick' | 'deepClick' | 'snappy' | 'tick' | 'rubber';

// ========== حالة الـ Shuffle ==========
let queue: SoundKey[] = [];
let lastPlayed: SoundKey | null = null;

// ========== دالة Fisher-Yates للخلط العشوائي ==========
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== إعادة بناء الـ Queue مع ضمان عدم تكرار آخر صوت ==========
function refillQueue() {
  let newQueue = shuffle(SOUND_KEYS);

  // لو أول صوت في الـ Queue الجديدة هو نفسه آخر صوت اتلعب
  // نبدّله بمكان عشوائي تاني
  if (lastPlayed && newQueue[0] === lastPlayed && newQueue.length > 1) {
    // نبدّل الأول بواحد عشوائي من الباقي
    const swapIndex = 1 + Math.floor(Math.random() * (newQueue.length - 1));
    [newQueue[0], newQueue[swapIndex]] = [newQueue[swapIndex], newQueue[0]];
  }

  queue = newQueue;
}

// ========== الدالة الرئيسية: العب الصوت التالي ==========
export function playNextSound() {
  // لو الـ Queue فاضية، عبّيها من جديد
  if (queue.length === 0) {
    refillQueue();
  }

  // اسحب أول صوت
  const next = queue.shift()!;
  lastPlayed = next;

  // العب
  try {
    soundFunctions[next]();
  } catch (err) {
    console.error('Sound playback failed:', err);
  }

  return next; // نرجّعه للـ debugging لو احتجت
}

// ========== للـ debugging: اعرض حالة الـ Queue ==========
export function getQueueState() {
  return {
    queue: [...queue],
    lastPlayed,
    remaining: queue.length,
  };
}