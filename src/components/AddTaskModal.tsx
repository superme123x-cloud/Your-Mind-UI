import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../api/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, projectId: number | null) => Promise<void>;
  projects: Project[];
}

export default function AddTaskModal({ isOpen, onClose, onAdd, projects }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setProjectId(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onAdd(title.trim(), description.trim(), projectId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="glass-card w-full max-w-lg p-8 relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">إضافة مهمة جديدة</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">عنوان المهمة</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب عنوان المهمة..."
              className="w-full px-5 py-4 bg-bg-dark border border-border-teal rounded-2xl text-white placeholder-gray-600 outline-none focus:border-accent focus:shadow-glow transition-all text-lg"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">إضافة وصف المهمة (اختياري)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="وصف مختصر..."
              className="w-full px-5 py-4 bg-bg-dark border border-border-teal rounded-2xl text-white placeholder-gray-600 outline-none focus:border-accent focus:shadow-glow transition-all"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">المشروع (اختياري)</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setProjectId(null)}
                className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                  projectId === null
                    ? 'bg-accent text-bg-dark border-accent font-bold'
                    : 'bg-bg-dark text-gray-400 border-border-teal hover:border-accent'
                }`}
              >
                بدون مشروع
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProjectId(p.id)}
                  className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                    projectId === p.id
                      ? 'bg-accent text-bg-dark border-accent font-bold'
                      : 'bg-bg-dark text-gray-400 border-border-teal hover:border-accent'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-4 bg-accent hover:bg-accent-glow text-bg-dark font-bold text-lg rounded-2xl shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الإضافة...' : 'إضافة الآن (Enter)'}
          </button>
        </form>
      </div>
    </div>
  );
}