import { useState, useEffect, useRef } from 'react';
import { statsApi } from '../api/client';
import type { DayStat, Summary, DistributionItem } from '../api/types';
import { Clock, CheckCircle2, TrendingUp, Flame, Award, Calendar, Activity } from 'lucide-react';

type ViewMode = 'today' | 'curve';

// ========== Curved Line Chart ==========
function CurveChart({ data }: { data: DayStat[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 40, right: 30, bottom: 50, left: 30 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const maxV = Math.max(...data.map((d) => d.completedTasks), 1);

    const points = data.map((d, i) => ({
      x: pad.left + (i / Math.max(data.length - 1, 1)) * cW,
      y: pad.top + cH - (d.completedTasks / maxV) * cH,
      value: d.completedTasks,
      date: d.date,
    }));

    ctx.clearRect(0, 0, W, H);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

    // Fill path with bezier
    ctx.beginPath();
    ctx.moveTo(points[0].x, H - pad.bottom);
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i], p1 = points[i + 1];
      ctx.bezierCurveTo(p0.x + (p1.x - p0.x) / 3, p0.y, p0.x + (2 * (p1.x - p0.x)) / 3, p1.y, p1.x, p1.y);
    }
    ctx.lineTo(points[points.length - 1].x, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i], p1 = points[i + 1];
      ctx.bezierCurveTo(p0.x + (p1.x - p0.x) / 3, p0.y, p0.x + (2 * (p1.x - p0.x)) / 3, p1.y, p1.x, p1.y);
    }
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Nodes + Labels
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Value above node
      if (p.value > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(p.value), p.x, p.y - 14);
      }
    });

    // Day labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Tajawal, sans-serif';
    ctx.textAlign = 'center';
    points.forEach((p) => {
      const day = new Date(p.date).toLocaleDateString('ar-EG', { weekday: 'short' });
      ctx.fillText(day, p.x, H - pad.bottom + 25);
    });
  }, [data]);

  return <canvas ref={canvasRef} className="w-full h-72 md:h-96" />;
}

// ========== Week View (حالة اليوم) ==========
function WeekView({ data }: { data: DayStat[] }) {
  const today = new Date().toDateString();
  return (
    <div className="py-8">
      <div className="flex items-center justify-between gap-2 md:gap-3">
        {data.map((d, i) => {
          const isToday = new Date(d.date).toDateString() === today;
          const isActive = d.completedTasks > 0 || d.focusMinutes > 0;
          const dayName = new Date(d.date).toLocaleDateString('ar-EG', { weekday: 'long' });

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-3">
              <span className={`text-xs md:text-sm font-medium ${isToday ? 'text-accent' : 'text-gray-500'}`}>
                {dayName}
              </span>
              <div
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-accent to-accent-glow shadow-glow'
                    : 'bg-card border-2 border-border-teal'
                } ${isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-dark' : ''}`}
              >
                {isActive ? (
                  <CheckCircle2 className="text-bg-dark" size={28} strokeWidth={3} />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                )}
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  {d.completedTasks}
                </p>
                <p className="text-[10px] text-gray-500">{d.focusMinutes}د</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== Main Stats ==========
export default function Stats() {
  const [weekly, setWeekly] = useState<DayStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  useEffect(() => {
    (async () => {
      try {
        const [w, s, d] = await Promise.all([statsApi.weekly(), statsApi.summary(), statsApi.distribution()]);
        setWeekly(w.data);
        setSummary(s.data);
        setDistribution(d.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="p-10 flex items-center justify-center min-h-screen"><p className="text-gray-400">جاري التحميل...</p></div>;

  const totalFocus = weekly.reduce((sum, d) => sum + d.focusMinutes, 0);
  const totalTasks = weekly.reduce((sum, d) => sum + d.completedTasks, 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">إحصائيات الإنجاز</h1>
        <p className="text-gray-400 text-sm">آخر 7 أيام</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* العمود الرئيسي (اليسار في RTL) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Toggle + Chart */}
          <div className="glass-card p-6">
            {/* Toggle */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex gap-2 bg-bg-dark border border-border-teal rounded-xl p-1">
                <button
                  onClick={() => setViewMode('today')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    viewMode === 'today' ? 'bg-accent text-bg-dark' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Calendar size={14} />
                  حالة اليوم
                </button>
                <button
                  onClick={() => setViewMode('curve')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    viewMode === 'curve' ? 'bg-accent text-bg-dark' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Activity size={14} />
                  كيرف الإنجاز
                </button>
              </div>
              <span className="text-xs text-gray-500">آخر 7 أيام</span>
            </div>

            {/* View */}
            <h2 className="text-xl font-bold text-white mb-4">
              {viewMode === 'today' ? 'حالة العمل اليومي' : 'كيرف الإنجاز'}
            </h2>

            {viewMode === 'today' ? <WeekView data={weekly} /> : <CurveChart data={weekly} />}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <Clock className="text-accent mb-2" size={18} />
              <p className="text-2xl font-bold text-white">{Math.round(totalFocus / 60)}س</p>
              <p className="text-xs text-gray-500">إجمالي التركيز</p>
            </div>
            <div className="glass-card p-4">
              <CheckCircle2 className="text-accent mb-2" size={18} />
              <p className="text-2xl font-bold text-white">{totalTasks}</p>
              <p className="text-xs text-gray-500">مهام مكتملة</p>
            </div>
            <div className="glass-card p-4">
              <TrendingUp className="text-accent mb-2" size={18} />
              <p className={`text-2xl font-bold ${(summary?.completionVsAveragePercent || 0) >= 0 ? 'text-accent' : 'text-red-400'}`}>
                {(summary?.completionVsAveragePercent || 0) >= 0 ? '+' : ''}{summary?.completionVsAveragePercent || 0}%
              </p>
              <p className="text-xs text-gray-500">مقارنة بمتوسطك</p>
            </div>
          </div>
        </div>

        {/* العمود الجانبي (اليمين في RTL) */}
        <div className="space-y-5">
          {/* Badge */}
          {summary?.badge && (
            <div className="glass-card p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
              <div className="relative">
                <Flame className="text-accent mx-auto mb-3" size={32} />
                <h3 className="text-xl font-bold text-white mb-4">{summary.badge}</h3>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/40 rounded-full">
                  <Award className="text-accent" size={14} />
                  <span className="text-xs text-accent font-bold">ACTIVE BADGE</span>
                </div>
              </div>
            </div>
          )}

          {/* Distribution */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-5">توزيع العمل العميق</h3>
            {distribution.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">مفيش بيانات لسه</p>
            ) : (
              <div className="space-y-4">
                {distribution.map((item) => (
                  <div key={item.projectId ?? 'unassigned'}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400 truncate">{item.name}</span>
                      <span className="text-xs font-bold text-white">{item.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent-glow"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Hours */}
          <div className="glass-card p-6 text-center">
            <p className="text-xs text-gray-400 mb-2">إجمالي ساعات التركيز</p>
            <p className="text-5xl font-bold text-accent" style={{ fontFamily: 'monospace' }}>
              {(totalFocus / 60).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">ساعة هذا الأسبوع</p>
          </div>
        </div>
      </div>
    </div>
  );
}