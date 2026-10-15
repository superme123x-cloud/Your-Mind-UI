import { useState, useEffect, useRef } from 'react';
import { statsApi } from '../api/client';
import type { DayStat, Summary, DistributionItem } from '../api/types';
import { Clock, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function CanvasChart({ data }: { data: DayStat[] }) {
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
    const pad = { top: 30, right: 20, bottom: 40, left: 20 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const maxV = Math.max(...data.map((d) => d.completedTasks), 1);

    const points = data.map((d, i) => ({
      x: pad.left + (i / Math.max(data.length - 1, 1)) * cW,
      y: pad.top + cH - (d.completedTasks / maxV) * cH,
      date: d.date,
    }));

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(20, 83, 65, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (cH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    // Fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

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
    ctx.stroke();

    // Nodes
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Tajawal, sans-serif';
    ctx.textAlign = 'center';
    points.forEach((p) => {
      const day = new Date(p.date).toLocaleDateString('ar-EG', { weekday: 'short' });
      ctx.fillText(day, p.x, H - pad.bottom + 20);
    });
  }, [data]);

  return <canvas ref={canvasRef} className="w-full h-56 md:h-64" />;
}

export default function Dashboard() {
  const { username } = useAuth();
  const [weekly, setWeekly] = useState<DayStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">أهلاً، {username} 👋</h1>
          <p className="text-gray-400 text-sm">نظرة سريعة على تقدمك</p>
        </div>
        {summary?.badge && (
          <div className="px-4 py-2 bg-accent/10 border border-accent/40 rounded-xl flex items-center gap-2 shadow-glow">
            <Flame className="text-accent" size={18} />
            <span className="text-accent font-bold text-sm">{summary.badge}</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">ساعات التركيز</span>
            <Clock className="text-accent" size={18} />
          </div>
          <p className="text-3xl font-bold text-white">{summary?.focusHours || 0}</p>
          <p className="text-xs text-gray-500 mt-1">آخر 7 أيام</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">مهام مكتملة</span>
            <CheckCircle2 className="text-accent" size={18} />
          </div>
          <p className="text-3xl font-bold text-white">{summary?.completedTasks || 0}</p>
          <p className="text-xs text-gray-500 mt-1">متوسط {summary?.avgTasksPerDay || 0} / يوم</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">مقارنة بمتوسطك</span>
            <TrendingUp className="text-accent" size={18} />
          </div>
          <p className={`text-3xl font-bold ${(summary?.completionVsAveragePercent || 0) >= 0 ? 'text-accent' : 'text-red-400'}`}>
            {(summary?.completionVsAveragePercent || 0) >= 0 ? '+' : ''}{summary?.completionVsAveragePercent || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary?.activeDays || 0} أيام نشطة</p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">تقدمك آخر 7 أيام</h2>
          <span className="text-xs text-gray-500">المهام المكتملة</span>
        </div>
        <CanvasChart data={weekly} />
      </div>

      {/* Distribution */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-5">توزيع وقت التركيز</h2>
        {distribution.length === 0 ? (
          <p className="text-gray-500 text-center py-6 text-sm">ابدأ سجّل جلسات بومودورو عشان تشوف التوزيع</p>
        ) : (
          <div className="space-y-4">
            {distribution.map((item) => (
              <div key={item.projectId ?? 'unassigned'}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{item.name}</span>
                    {item.categoryCode && (
                      <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/30">{item.categoryCode}</span>
                    )}
                  </div>
                  <span className="text-accent font-bold text-sm">
                    {Math.floor(item.minutes / 60)}س {item.minutes % 60}د
                    <span className="text-gray-500 text-xs mr-2">({item.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-dark rounded-full overflow-hidden border border-border-teal">
                  <div className="h-full bg-gradient-to-l from-accent to-accent-glow transition-all duration-700" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}