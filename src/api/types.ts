// ============ Auth ============
export interface AuthResponse {
  token: string;
  username: string;
  expiresAt: string;
}

export interface RegisterDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

// ============ Projects ============
export interface Project {
  id: number;
  name: string;
  categoryCode: string;
  targetWeek: number | null;
  createdAt: string;
}

export interface ProjectInput {
  name: string;
  categoryCode: string;
  targetWeek: number | null;
}

// ============ Tasks ============
export interface Task {
  id: number;
  title: string;
  description: string | null;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  projectId: number | null;
  projectName: string | null;
  categoryCode: string | null;
}

export interface TasksToday {
  tasks: Task[];
  completed: number;
  total: number;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  projectId?: number | null;
}

// ============ Pomodoro ============
export interface PomodoroSession {
  id: number;
  taskId: number | null;
  projectId: number | null;
  activityType: string;
  durationMinutes: number;
  completedAt: string;
}

export interface PomodoroInput {
  taskId?: number | null;
  projectId?: number | null;
  activityType?: string;
  durationMinutes: number;
}

// ============ Stats ============
export interface DayStat {
  date: string;
  completedTasks: number;
  focusMinutes: number;
}

export interface Summary {
  focusHours: number;
  completedTasks: number;
  avgTasksPerDay: number;
  completionVsAveragePercent: number;
  activeDays: number;
  badge: string | null;
}

export interface DistributionItem {
  projectId: number | null;
  name: string;
  categoryCode: string | null;
  minutes: number;
  percent: number;
}

// ============ AI ============
export interface ExtractedTask {
  title: string;
  description: string | null;
  projectName: string | null;
}

export interface ExtractResult {
  suggestions: ExtractedTask[];
  created: Task[] | null;
}

export interface ExtractRequest {
  text: string;
  save: boolean;
}