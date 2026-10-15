import { useState } from 'react';
import { aiApi, tasksApi, projectsApi } from '../api/client';
import type { Project, ExtractedTask } from '../api/types';
import { Sparkles, Wand2, Check, Plus, Loader2, Lightbulb } from 'lucide-react';

const EXAMPLES = [
  'أذاكر شابتر 3 فيزياء وأحل 10 مسائل، وأراجع كود المشروع، وأتمرن رياضة',
  'أجهز عرض التخرج، أراجع مع الدكتور، أشتري هدية لأمي',
  'Pomodoro 25 mins on graduation project, review math notes, call supervisor',
];

export default function Assistant() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ExtractedTask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleExtract = async (text?: string) => {
    const finalText = text ?? input;
    if (!finalText.trim() || finalText.trim().length < 5) {
      setError('اكتب جملة أطول شوية');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    setSuggestions([]);
    setSelected(new Set());

    try {
      // Load projects once
      if (projects.length === 0) {
        const p = await projectsApi.list();
        setProjects(p.data);
      }

      const res = await aiApi.extract({ text: finalText, save: false });
      const sugg: ExtractedTask[] = res.data.suggestions || [];
      setSuggestions(sugg);
      setSelected(new Set(sugg.map((_, i) => i)));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 503) setError('الـ AI مش متظبط. تأكد من إضافة Gemini API Key في الباك إند.');
      else if (status === 502) setError('الـ AI مش راضي يرد. جرب تاني.');
      else setError('حصل خطأ، جرب تاني.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const handleSaveAll = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const toAdd = suggestions.filter((_, i) => selected.has(i));
      await Promise.all(
        toAdd.map((s) => {
          const project = s.projectName
            ? projects.find((p) => p.name.toLowerCase() === s.projectName!.toLowerCase())
            : null;
          return tasksApi.create({
            title: s.title,
            description: s.description,
            projectId: project?.id ?? null,
          });
        })
      );
      setSuccessMsg(`تم إضافة ${toAdd.length} مهمة ✅`);
      setSuggestions([]);
      setSelected(new Set());
      setInput('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('حصل خطأ أثناء الإضافة');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-glow">
            <Sparkles className="text-bg-dark" size={24} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">المساعد الذكي</h1>
            <p className="text-gray-400 text-sm">اكتب بحرية، والـ AI هيطلعلك المهام</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="glass-card p-6 mb-6">
        <label className="block text-sm text-gray-400 mb-3 flex items-center gap-2">
          <Wand2 size={16} className="text-accent" />
          اكتب اللي في دماغك (عربي أو إنجليزي)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="مثلاً: أذاكر شابتر 3 وأحل 10 مسائل، وأراجع كود المشروع، وأتمرن رياضة..."
          rows={4}
          className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white placeholder-gray-600 outline-none focus:border-accent focus:shadow-glow transition-all resize-none text-lg"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExtract();
          }}
        />

        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.slice(0, 2).map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(ex);
                  handleExtract(ex);
                }}
                className="text-xs px-3 py-1.5 bg-bg-dark border border-border-teal rounded-lg text-gray-400 hover:text-accent hover:border-accent transition-all"
              >
                <Lightbulb size={12} className="inline ml-1" />
                {ex.slice(0, 30)}...
              </button>
            ))}
          </div>
          <button
            onClick={() => handleExtract()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-br from-accent to-accent-glow text-bg-dark font-bold rounded-xl flex items-center gap-2 shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                جاري التحليل...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                استخرج المهام (Ctrl+Enter)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 mb-6 border-red-500/40 bg-red-500/5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="glass-card p-4 mb-6 border-accent/40 bg-accent/5">
          <p className="text-accent text-sm font-bold">{successMsg}</p>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">المهام المقترحة</h2>
              <p className="text-sm text-gray-500 mt-1">
                اختر اللي عايز تضيفه ({selected.size} من {suggestions.length})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(new Set(suggestions.map((_, i) => i)))}
                className="text-xs px-3 py-1.5 bg-bg-dark border border-border-teal rounded-lg text-gray-400 hover:text-white transition-all"
              >
                تحديد الكل
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs px-3 py-1.5 bg-bg-dark border border-border-teal rounded-lg text-gray-400 hover:text-white transition-all"
              >
                إلغاء الكل
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => toggleSuggestion(i)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  selected.has(i)
                    ? 'border-accent bg-accent/5'
                    : 'border-border-teal bg-bg-dark hover:border-accent/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    selected.has(i)
                      ? 'bg-accent border-accent'
                      : 'border-gray-600'
                  }`}
                >
                  {selected.has(i) && <Check size={14} className="text-bg-dark" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{s.title}</p>
                  {s.description && (
                    <p className="text-gray-500 text-sm mt-1">{s.description}</p>
                  )}
                  {s.projectName && (
                    <span className="inline-block text-xs px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/30 mt-2">
                      {s.projectName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving || selected.size === 0}
            className="w-full py-4 bg-gradient-to-br from-accent to-accent-glow text-bg-dark font-bold rounded-xl flex items-center justify-center gap-2 shadow-glow hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                جاري الإضافة...
              </>
            ) : (
              <>
                <Plus size={18} />
                إضافة {selected.size} مهمة
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && suggestions.length === 0 && !error && !successMsg && (
        <div className="glass-card p-12 text-center">
          <Sparkles className="text-gray-600 mx-auto mb-4" size={48} />
          <p className="text-gray-400 mb-2 text-lg">ابدأ بكتابة أفكارك فوق</p>
          <p className="text-gray-600 text-sm">
            الـ AI هيفهمك ويطلعلك المهام جاهزة للإضافة
          </p>
        </div>
      )}
    </div>
  );
}