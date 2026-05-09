import React, { useEffect, useState } from "react";
import {
  X,
  Lock,
  AlertTriangle,
  Link2,
  Users,
  User as UserIcon,
} from "lucide-react";
import type { Task, TaskStatus, Priority, TaskType } from "../types";
import {
  ALL_STATUSES,
  STATUS_CONFIG,
  TASK_TYPE_CONFIG,
  GROUPS,
  SUBJECTS,
} from "../types";
import { useAuthStore } from "../store/authStore";
import { getUsers } from "../services/api";
import type { User } from "../types";
import CustomSelect from "./CustomSelect";
import { MOCK_USERS } from "../data/mockData";

interface Props {
  open: boolean;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
}

interface FormState {
  title: string;
  description: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignedTo: string;
  assignedToGroup: string;
  assignTarget: "individual" | "group";
  tags: string[];
  quizLink: string;
  maxMarks: string;
  subject: string;
  semester: string;
  grade: string;
  feedback: string;
}

const TaskModal: React.FC<Props> = ({
  open,
  task,
  defaultStatus = "todo",
  onClose,
  onSave,
}) => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    taskType: "assignment",
    status: "todo" as TaskStatus,
    priority: "medium",
    dueDate: "",
    assignedTo: "",
    assignedToGroup: "",
    assignTarget: "individual",
    tags: [],
    quizLink: "",
    maxMarks: "",
    subject: "",
    semester: "",
    grade: "",
    feedback: "",
  });

  const isLocked = !!task?.submittedAt || !!task?.gradedAt;
  const isGradeMode = user?.role === "teacher" && task?.status === "monitoring";
  const canEditGrade =
    user?.role === "teacher" &&
    (task?.status === "monitoring" || task?.status === "done") &&
    !task?.gradedAt;

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        taskType: task.taskType || "assignment",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.split("T")[0] || "",
        assignedTo: task.assignedTo?.id || "",
        assignedToGroup: task.assignedToGroup || "",
        assignTarget: task.assignedToGroup ? "group" : "individual",
        tags: task.tags || [],
        quizLink: task.quizLink || "",
        maxMarks: task.maxMarks?.toString() || "",
        subject: task.subject || "",
        semester: task.semester?.toString() || "",
        grade: task.grade?.toString() || "",
        feedback: task.feedback || "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        taskType: "assignment",
        status: "todo" as TaskStatus,
        priority: "medium",
        dueDate: "",
        assignedTo: "",
        assignedToGroup: "",
        assignTarget: "individual",
        tags: [],
        quizLink: "",
        maxMarks: "",
        subject: "",
        semester: "",
        grade: "",
        feedback: "",
      });
    }
    if (user?.role !== "student") {
      getUsers()
        .then((r) => setUsers(r.data.users || []))
        .catch(() => {
          setUsers(MOCK_USERS.filter((u) => u.role === "student"));
        });
    }
  }, [open, task, defaultStatus, user]);

  const set = (k: keyof FormState, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) return;
    if (isLocked && !canEditGrade) return;
    setLoading(true);
    try {
      const payload: Partial<Task> = {
        title: form.title,
        description: form.description,
        taskType: form.taskType,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate,
        tags: form.tags,
        quizLink: form.quizLink || undefined,
        maxMarks: form.maxMarks ? Number(form.maxMarks) : undefined,
        subject: form.subject || undefined,
        semester: form.semester ? Number(form.semester) : undefined,
        assignedToGroup:
          form.assignTarget === "group" ? form.assignedToGroup : undefined,
        assignedTo: form.assignedTo as any,
      };
      if (canEditGrade && form.grade) {
        payload.grade = Number(form.grade);
        payload.feedback = form.feedback;
        payload.gradedAt = new Date().toISOString();
        payload.status = "done";
      }
      await onSave(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const handleDueDateChange = (val: string) => {
    // Reject today or any past date
    if (val && val < tomorrow) return;
    set("dueDate", val);
  };

  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400`;
  const labelCls = `block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isGradeMode ? "Grade Task" : task ? "Edit Task" : "New Task"}
            </h2>
            {isLocked && !canEditGrade && (
              <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                <Lock size={10} /> Locked
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Grade mode — only show grade + feedback */}
          {isGradeMode ? (
            <>
              <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 space-y-1">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                  {task?.title}
                </p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400">
                  {task?.taskType && TASK_TYPE_CONFIG[task.taskType]?.label} ·
                  Max marks: {task?.maxMarks ?? "N/A"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {task?.description}
                </p>
              </div>
              <div>
                <label className={labelCls}>
                  Grade / Marks <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={task?.maxMarks ?? 30}
                  value={form.grade}
                  onChange={(e) => set("grade", e.target.value)}
                  required
                  className={inputCls}
                  placeholder={`Out of ${task?.maxMarks ?? 30}`}
                />
              </div>
              <div>
                <label className={labelCls}>Feedback to Student</label>
                <textarea
                  value={form.feedback}
                  onChange={(e) => set("feedback", e.target.value)}
                  rows={3}
                  className={inputCls + " resize-none"}
                  placeholder="Great work! / Please revise section 2..."
                />
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 rounded-xl px-3 py-2 flex items-start gap-1.5">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  Once you submit the grade, this task will be{" "}
                  <strong>locked</strong> and cannot be changed.
                </span>
              </p>
            </>
          ) : (
            <>
              {/* Task Type */}
              {!task && (
                <div>
                  <label className={labelCls}>Task Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(TASK_TYPE_CONFIG) as TaskType[]).map((t) => {
                      const cfg = TASK_TYPE_CONFIG[t];
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => set("taskType", t)}
                          className={`py-2 px-1 rounded-xl border-2 text-xs font-semibold text-center transition ${
                            form.taskType === t
                              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                              : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                          }`}
                        >
                          <div className="text-lg mb-0.5">{cfg.icon}</div>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className={labelCls}>
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  disabled={isLocked && !canEditGrade}
                  className={inputCls}
                  placeholder="e.g. Data Structures Assignment #3"
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>
                  {form.taskType === "quiz"
                    ? "Quiz Instructions"
                    : "Description / Instructions"}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  disabled={isLocked && !canEditGrade}
                  className={inputCls + " resize-none"}
                  placeholder="Describe what students need to do..."
                />
              </div>

              {/* Quiz link (only for quiz type) */}
              {(form.taskType === "quiz" || task?.taskType === "quiz") && (
                <div>
                  <label className={labelCls + " flex items-center gap-1"}>
                    <Link2 size={12} /> Quiz Link
                  </label>
                  <input
                    type="url"
                    value={form.quizLink}
                    onChange={(e) => set("quizLink", e.target.value)}
                    disabled={isLocked && !canEditGrade}
                    className={inputCls}
                    placeholder="https://forms.google.com/..."
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Students will only attempt this link once. Once submitted,
                    it's locked.
                  </p>
                </div>
              )}

              {/* Max Marks + Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Max Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.maxMarks}
                    onChange={(e) => set("maxMarks", e.target.value)}
                    disabled={isLocked && !canEditGrade}
                    className={inputCls}
                    placeholder="Max 30"
                  />
                </div>
                <div>
                  <label className={labelCls}>Subject</label>
                  <CustomSelect
                    value={form.subject}
                    onChange={(v) => set("subject", v)}
                    disabled={!!(isLocked && !canEditGrade)}
                    placeholder="Select subject"
                    options={SUBJECTS.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              </div>

              {/* Semester (teacher/admin only) */}
              {(user?.role === "teacher" || user?.role === "admin") && (
                <div>
                  <label className={labelCls}>Semester</label>
                  <CustomSelect
                    value={form.semester}
                    onChange={(v) => set("semester", v)}
                    disabled={!!(isLocked && !canEditGrade)}
                    placeholder="Select semester"
                    options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                      value: String(n),
                      label: `Semester ${n}`,
                    }))}
                  />
                </div>
              )}

              {/* Status + Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Status</label>
                  {/* Read-only display when creating; CustomSelect when editing */}
                  {!task ? (
                    <div
                      className={
                        inputCls +
                        " bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-default"
                      }
                    >
                      Assigned
                    </div>
                  ) : (
                    <CustomSelect
                      value={form.status}
                      onChange={(v) => set("status", v)}
                      disabled={!!(isLocked && !canEditGrade)}
                      options={ALL_STATUSES.map((s) => ({
                        value: s,
                        label: STATUS_CONFIG[s].label,
                      }))}
                    />
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    required
                    min={tomorrow}
                    disabled={isLocked && !canEditGrade}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Assign To (teacher/admin only) */}
              {user?.role !== "student" && (
                <div className="space-y-2">
                  <label className={labelCls}>Assign To</label>
                  <div className="flex gap-2">
                    {(["individual", "group"] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => set("assignTarget", t)}
                        disabled={isLocked}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border-2 capitalize transition flex items-center justify-center gap-1.5 ${
                          form.assignTarget === t
                            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                            : "border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                        }`}
                      >
                        {t === "individual" ? (
                          <UserIcon size={12} />
                        ) : (
                          <Users size={12} />
                        )}
                        {t === "individual" ? "Individual" : "Group"}
                      </button>
                    ))}
                  </div>
                  {form.assignTarget === "individual" ? (
                    <CustomSelect
                      value={form.assignedTo}
                      onChange={(v) => set("assignedTo", v)}
                      disabled={isLocked}
                      placeholder="Select student..."
                      options={users
                        .filter((u) => u.role === "student")
                        .map((u) => ({
                          value: u.id,
                          label: `${u.name}${u.groupId ? ` (${u.groupId})` : ""}`,
                        }))}
                    />
                  ) : (
                    <CustomSelect
                      value={form.assignedToGroup}
                      onChange={(v) => set("assignedToGroup", v)}
                      disabled={isLocked}
                      placeholder="Select group..."
                      options={GROUPS.map((g) => ({ value: g, label: g }))}
                    />
                  )}
                </div>
              )}

              {isLocked && !canEditGrade && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                  <Lock size={14} /> This task is locked and cannot be edited.
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            {(!isLocked || canEditGrade) && (
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 font-semibold text-sm rounded-xl transition flex items-center gap-2 text-white ${
                  isGradeMode
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } disabled:opacity-60`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {isGradeMode
                  ? "Submit Grade"
                  : task
                    ? "Save Changes"
                    : "Create Task"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
