import { useState, useEffect } from 'react';
import { playNextSound } from '../utils/soundEngine';
import { tasksApi, projectsApi } from '../api/client';
import type { Task, Project, TasksToday } from '../api/types';
import { Check, Trash2, GripVertical, Edit2, X, Plus } from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddTaskModal from '../components/AddTaskModal';

// ========== Sortable Task Item ==========
function SortableTaskItem({ task, onToggle, onDelete, onEdit }: {
  task: Task;
  onToggle: (t: Task) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  onEdit: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.25 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-4 flex items-center gap-3 group transition-colors ${
        task.isCompleted ? 'opacity-60' : 'hover:border-accent/60'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-600 hover:text-accent transition-colors touch-none"
      >
        <GripVertical size={18} />
      </div>

      <div
        onClick={() => onToggle(task)}
        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
          task.isCompleted ? 'bg-accent border-accent' : 'border-gray-600 hover:border-accent'
        }`}
      >
        {task.isCompleted && <Check size={18} className="text-bg-dark" strokeWidth={3} />}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(task)}>
        <p className={`text-lg transition-all ${task.isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
        )}
        {task.projectName && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/40">
              {task.projectName}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={(e) => onDelete(e, task.id)}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ========== Main Tasks ==========
export default function Tasks() {
  const [tasksToday, setTasksToday] = useState<TasksToday>({ tasks: [], completed: 0, total: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  

  const loadData = async () => {
    try {
      const [t, p] = await Promise.all([tasksApi.today(), projectsApi.list()]);
      setTasksToday(t.data);
      setProjects(p.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const i = setInterval(loadData, 60000);
    return () => clearInterval(i);
  }, []);

  const handleAddTask = async (title: string, description: string, projectId: number | null) => {
    await tasksApi.create({ title, description, projectId });
    await loadData();
  };

  const handleToggle = async (task: Task) => {
  try {
    await tasksApi.toggle(task.id);
    if (!task.isCompleted) playNextSound(); // 👈 الجديد
    await loadData();
  } catch (err) { console.error(err); }
};

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('متأكد إنك عايز تمسح المهمة دي؟')) return;
    try { await tasksApi.delete(id); await loadData(); } catch (err) { console.error(err); }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const t = tasksToday.tasks.find((x) => x.id === e.active.id);
    setActiveTask(t || null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over || active.id === over.id) return;
    const oldI = tasksToday.tasks.findIndex((t) => t.id === active.id);
    const newI = tasksToday.tasks.findIndex((t) => t.id === over.id);
    const newTasks = arrayMove(tasksToday.tasks, oldI, newI);
    setTasksToday({ ...tasksToday, tasks: newTasks });
    try { await tasksApi.reorder(newTasks.map((t) => t.id)); }
    catch { loadData(); }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditProjectId(task.projectId);
  };

  const handleUpdate = async () => {
    if (!editingTask || !editTitle.trim()) return;
    try {
      await tasksApi.update(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        projectId: editProjectId,
      });
      setEditingTask(null);
      await loadData();
    } catch (err) { console.error(err); }
  };

  const progress = tasksToday.total > 0 ? Math.round((tasksToday.completed / tasksToday.total) * 100) : 0;

  if (loading) {
    return <div className="p-10 flex items-center justify-center min-h-screen"><p className="text-gray-400">جاري التحميل...</p></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto relative min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">المهام</h1>
        <p className="text-gray-400">خطط ليومك، وأنجز واحدة واحدة</p>
      </div>

      {/* Progress */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">تقدم النهاردة</span>
          <span className="text-2xl font-bold text-accent">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-bg-dark rounded-full overflow-hidden border border-border-teal">
          <div className="h-full bg-gradient-to-l from-accent to-accent-glow transition-all duration-500 shadow-glow" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-500">{tasksToday.completed} من {tasksToday.total} مهام</span>
          {tasksToday.completed > 0 && <span className="text-accent font-bold">استمر! 🔥</span>}
        </div>
      </div>

      {/* List */}
      {tasksToday.tasks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-400 mb-2 text-lg">مفيش مهام لسه النهاردة ✨</p>
          <p className="text-gray-600 text-sm">اضغط على الزرار اللي تحت عشان تضيف مهمة</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={tasksToday.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pb-24">
              {tasksToday.tasks.map((task) => (
                <SortableTaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
            {activeTask ? (
              <div className="glass-card p-4 flex items-center gap-3 border-accent/60 shadow-glow-lg scale-[1.02] rotate-[1deg] cursor-grabbing bg-card">
                <div className="p-1 text-accent"><GripVertical size={18} /></div>
                <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 ${activeTask.isCompleted ? 'bg-accent border-accent' : 'border-gray-600'}`}>
                  {activeTask.isCompleted && <Check size={18} className="text-bg-dark" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-lg ${activeTask.isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>{activeTask.title}</p>
                  {activeTask.projectName && (
                    <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/40 inline-block mt-1">{activeTask.projectName}</span>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <p className="text-center text-xs text-gray-600 mt-8">💡 المهام غير المكتملة بتتمسح أوتوماتيك الساعة 12 بالليل</p>

      {/* FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 left-8 w-14 h-14 bg-gradient-to-br from-accent to-accent-glow text-bg-dark rounded-full flex items-center justify-center shadow-glow hover:scale-110 active:scale-95 transition-transform z-40"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTask}
        projects={projects}
      />

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">تعديل المهمة</h2>
              <button onClick={() => setEditingTask(null)} className="p-2 text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">اسم المهمة</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white outline-none focus:border-accent" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">الوصف</label>
                <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">المشروع</label>
                <select value={editProjectId ?? ''} onChange={(e) => setEditProjectId(e.target.value ? Number(e.target.value) : null)} className="w-full px-4 py-3 bg-bg-dark border border-border-teal rounded-xl text-white outline-none focus:border-accent">
                  <option value="">بدون مشروع</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleUpdate} className="flex-1 py-3 bg-accent hover:bg-accent-glow text-bg-dark font-bold rounded-xl">حفظ</button>
                <button onClick={() => setEditingTask(null)} className="px-5 py-3 border border-border-teal text-gray-400 hover:text-white rounded-xl">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}