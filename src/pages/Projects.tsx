import { useState, useEffect } from 'react';
import { projectsApi } from '../api/client';
import type { Project } from '../api/types';
import { Plus, Trash2, Edit2, X, FolderKanban } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [targetWeek, setTargetWeek] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await projectsApi.list();
      setProjects(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCategoryCode('');
    setTargetWeek(null);
    setIsModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setName(p.name);
    setCategoryCode(p.categoryCode);
    setTargetWeek(p.targetWeek);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryCode.trim()) return;
    try {
      if (editing) {
        await projectsApi.update(editing.id, { name: name.trim(), categoryCode: categoryCode.trim(), targetWeek });
      } else {
        await projectsApi.create({ name: name.trim(), categoryCode: categoryCode.trim(), targetWeek });
      }
      setIsModalOpen(false);
      await load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('متأكد إنك عايز تمسح المشروع ده؟ المهام هتفضل موجودة بدون مشروع.')) return;
    try { await projectsApi.delete(id); await load(); } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-10 flex items-center justify-center min-h-screen"><p className="text-gray-400">جاري التحميل...</p></div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">المشاريع</h1>
          <p className="text-gray-400">قسّم شغلك على مشاريع عشان تتتبع أفضل</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-3 bg-accent hover:bg-accent-glow text-bg-dark font-bold rounded-xl flex items-center gap-2 shadow-glow transition-all"
        >
          <Plus size={18} />
          مشروع جديد
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FolderKanban className="text-gray-600 mx-auto mb-4" size={48} />
          <p className="text-gray-400 mb-2 text-lg">مفيش مشاريع لسه</p>
          <p className="text-gray-600 text-sm">ابدأ بمشروع جديد عشان تقسم شغلك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="glass-card p-5 flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/40 flex items-center justify-center shrink-0">
                <FolderKanban className="text-accent" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/30">
                    {p.categoryCode}
                  </span>
                  {p.targetWeek && (
                    <span className="text-xs text-gray-500">أسبوع {p.targetWeek}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'تعديل مشروع' : 'مشروع جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">اسم المشروع</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="مشروع التخرج"
                  className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">كود المشروع (اختصار)</label>
                <input
                  type="text"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="GRAD"
                  className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white outline-none focus:border-accent uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">الأسبوع المستهدف (اختياري)</label>
                <input
                  type="number"
                  value={targetWeek ?? ''}
                  onChange={(e) => setTargetWeek(e.target.value ? Number(e.target.value) : null)}
                  min={1}
                  max={53}
                  placeholder="15"
                  className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-accent hover:bg-accent-glow text-bg-dark font-bold rounded-xl">
                  {editing ? 'حفظ التعديلات' : 'إضافة المشروع'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 border border-border-teal text-gray-400 hover:text-white rounded-xl">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}