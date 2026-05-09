export type Role = "student" | "teacher" | "admin";
export type TaskStatus =
  | "todo"
  | "in-progress"
  | "on-hold"
  | "monitoring"
  | "done";
export type Priority = "low" | "medium" | "high";
export type TaskType = "assignment" | "quiz" | "project" | "presentation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  groupId?: string; // e.g. 'G1', 'G2'
  semester?: number; // 1-8, used for student grouping
}

export interface Task {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  tags: string[];
  // Assignment target
  assignedTo: User;
  assignedToGroup?: string; // e.g. 'Group 1' — null means individual
  createdBy: User;
  // Type-specific fields
  quizLink?: string; // quiz only
  maxMarks?: number; // all types
  grade?: number; // filled by teacher on grading
  feedback?: string; // teacher feedback on grading
  semester?: number; // task's semester (1-8), for teacher/admin filter
  subject?: string; // e.g. 'Data Structures', 'Operating Systems'
  // Lock flags
  submittedAt?: string; // set when student submits — locks student actions
  gradedAt?: string; // set when teacher grades — locks teacher actions
  createdAt: string;
  updatedAt: string;
}

export const SUBJECTS = [
  "Data Structures",
  "Operating Systems",
  "Database Management",
  "Full Stack Development",
  "Machine Learning",
  "Computer Networks",
  "Software Engineering",
  "Physics",
  "Mathematics",
];

export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; icon: string; color: string; darkColor: string }
> = {
  assignment: {
    label: "Assignment",
    icon: "📋",
    color: "bg-blue-100 text-blue-700",
    darkColor: "dark:bg-blue-900/40 dark:text-blue-300",
  },
  quiz: {
    label: "Quiz",
    icon: "📝",
    color: "bg-purple-100 text-purple-700",
    darkColor: "dark:bg-purple-900/40 dark:text-purple-300",
  },
  project: {
    label: "Project",
    icon: "🚀",
    color: "bg-orange-100 text-orange-700",
    darkColor: "dark:bg-orange-900/40 dark:text-orange-300",
  },
  presentation: {
    label: "Presentation",
    icon: "🎤",
    color: "bg-pink-100 text-pink-700",
    darkColor: "dark:bg-pink-900/40 dark:text-pink-300",
  },
};

// Status flow comment:
// Student moves:  todo → in-progress → on-hold (submit) [LOCKED after on-hold]
// Teacher moves:  on-hold → monitoring → done (grade)   [LOCKED after done]
export const STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    color: string;
    darkColor: string;
    dot: string;
    bg: string;
    darkBg: string;
    border: string;
    darkBorder: string;
    borderLeft: string;
    studentLabel?: string;
    teacherLabel?: string;
  }
> = {
  todo: {
    label: "Assigned",
    studentLabel: "Assigned to Me",
    teacherLabel: "Assigned",
    color: "text-blue-600",
    darkColor: "dark:text-blue-400",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    darkBg: "dark:bg-blue-950/60",
    border: "border-blue-200",
    darkBorder: "dark:border-blue-800/60",
    borderLeft: "border-l-blue-400",
  },
  "in-progress": {
    label: "In Progress",
    studentLabel: "Working On",
    teacherLabel: "In Progress",
    color: "text-amber-600",
    darkColor: "dark:text-amber-400",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    darkBg: "dark:bg-amber-950/60",
    border: "border-amber-200",
    darkBorder: "dark:border-amber-800/60",
    borderLeft: "border-l-amber-400",
  },
  "on-hold": {
    label: "Submitted",
    studentLabel: "Submitted",
    teacherLabel: "Submitted",
    color: "text-teal-600",
    darkColor: "dark:text-teal-400",
    dot: "bg-teal-500",
    bg: "bg-teal-50",
    darkBg: "dark:bg-teal-950/60",
    border: "border-teal-200",
    darkBorder: "dark:border-teal-800/60",
    borderLeft: "border-l-teal-400",
  },
  monitoring: {
    label: "Under Review",
    studentLabel: "Being Reviewed",
    teacherLabel: "Under Review",
    color: "text-purple-600",
    darkColor: "dark:text-purple-400",
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    darkBg: "dark:bg-purple-950/60",
    border: "border-purple-200",
    darkBorder: "dark:border-purple-800/60",
    borderLeft: "border-l-purple-400",
  },
  done: {
    label: "Graded",
    studentLabel: "Graded",
    teacherLabel: "Graded",
    color: "text-emerald-600",
    darkColor: "dark:text-emerald-400",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    darkBg: "dark:bg-emerald-950/60",
    border: "border-emerald-200",
    darkBorder: "dark:border-emerald-800/60",
    borderLeft: "border-l-emerald-400",
  },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string }
> = {
  low: { label: "Low", color: "text-slate-500 bg-slate-100" },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-100" },
  high: { label: "High", color: "text-red-600 bg-red-100" },
};

export const ALL_STATUSES: TaskStatus[] = [
  "todo",
  "in-progress",
  "on-hold",
  "monitoring",
  "done",
];

export const GROUPS = ["Group 1", "Group 2", "Group 3", "Group 4"];
