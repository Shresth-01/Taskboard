import React, { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
  Users,
  FlaskConical,
} from "lucide-react";
import toast from "react-hot-toast";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import { useTaskStore } from "../store/taskStore";
import { useAuthStore } from "../store/authStore";
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../services/api";
import type { Task, TaskStatus } from "../types";
import {
  ALL_STATUSES,
  STATUS_CONFIG,
  TASK_TYPE_CONFIG,
  SUBJECTS,
} from "../types";
import { MOCK_TASKS, MOCK_USERS } from "../data/mockData";

const isOverdue = (d: string, status: string) =>
  status !== "done" && new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));

const BoardPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    tasks,
    setTasks,
    demoMode,
    setDemoMode,
    updateTask: storeUpdateTask,
    deleteTask: storeDelete,
  } = useTaskStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus[]>([
    ...ALL_STATUSES,
  ]);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [loading, setLoading] = useState(false);

  // Modals
  const [createModal, setCreateModal] = useState<{
    open: boolean;
    status: TaskStatus;
  }>({ open: false, status: "todo" });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTasks();
      setTasks(res.data.tasks || []);
      setDemoMode(false);
    } catch {
      // Backend not connected yet — show mock data
      setTasks(MOCK_TASKS);
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [setTasks, setDemoMode]);

  useEffect(() => {
    if (demoMode) {
      // Already in demo mode — load mock data without hitting the backend
      setTasks(MOCK_TASKS);
    } else {
      fetchTasks();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter tasks
  const filtered = tasks.filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus.includes(t.status);
    const matchOverdue = !filterOverdue || isOverdue(t.dueDate, t.status);
    const matchSubject = filterSubject === "all" || t.subject === filterSubject;
    const matchSemester =
      filterSemester === "all" || String(t.semester) === filterSemester;
    // Students only see their tasks
    const matchRole =
      user?.role !== "student" ||
      t.assignedTo?.id === user.id ||
      t.assignedTo?.email === user.email;
    return (
      matchSearch &&
      matchStatus &&
      matchOverdue &&
      matchSubject &&
      matchSemester &&
      matchRole
    );
  });

  const overdueCount = filtered.filter((t) =>
    isOverdue(t.dueDate, t.status),
  ).length;

  const toggleStatusFilter = (s: TaskStatus) => {
    setFilterStatus((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  // Student: todo→in-progress, in-progress→on-hold ONLY. Locked after on-hold.
  // Teacher: on-hold→monitoring, monitoring→done ONLY. Locked after done.
  const STUDENT_ALLOWED: Partial<Record<TaskStatus, TaskStatus>> = {
    todo: "in-progress",
    "in-progress": "on-hold",
  };
  const TEACHER_ALLOWED: Partial<Record<TaskStatus, TaskStatus>> = {
    "on-hold": "monitoring",
    monitoring: "done",
  };

  // Drag & Drop handler
  const advanceTask = async (task: Task) => {
    const newStatus = STUDENT_ALLOWED[task.status];
    if (!newStatus) return;
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === "on-hold") updates.submittedAt = new Date().toISOString();
    storeUpdateTask(task.id, updates);
    try {
      if (!demoMode) await updateTaskStatus(task.id, newStatus);
      toast.success(
        newStatus === "on-hold"
          ? "Submitted. Task is now locked."
          : "Task moved to In Progress",
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const reviewTask = async (task: Task) => {
    storeUpdateTask(task.id, { status: "monitoring" });
    try {
      if (!demoMode) await updateTaskStatus(task.id, "monitoring");
      toast.success("Task moved to Under Review");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId as TaskStatus;
    const srcStatus = source.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    if (user?.role === "student") {
      // Must be their task
      if (
        task.assignedTo?.id !== user.id &&
        task.assignedTo?.email !== user.email
      ) {
        toast.error("You can only move your own tasks");
        return;
      }
      // Locked after submitted
      if (task.submittedAt) {
        toast.error("Task is locked after submission — cannot be moved");
        return;
      }
      // Only allowed transition
      if (STUDENT_ALLOWED[srcStatus] !== newStatus) {
        toast.error(`Students can only move: Assigned → In Progress → Submit`);
        return;
      }
      // Submitting (in-progress → on-hold) non-quiz tasks requires a file/link
      // File upload is only available in the task detail modal
      if (newStatus === "on-hold" && task.taskType !== "quiz") {
        toast.error(
          "Please open the task and upload your file before submitting",
          { duration: 4000 },
        );
        return;
      }
    } else if (user?.role === "teacher") {
      // Teacher — can only do teacher-side transitions
      if (task.gradedAt) {
        toast.error("Task is graded and locked — cannot be moved");
        return;
      }
      if (TEACHER_ALLOWED[srcStatus] !== newStatus) {
        toast.error(
          "Teachers can only move: Submitted → Under Review → Graded",
        );
        return;
      }
    }
    // admin — no restrictions

    // Apply lock timestamps and update store in one call
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === "on-hold") updates.submittedAt = new Date().toISOString();
    if (newStatus === "done") updates.gradedAt = new Date().toISOString();

    storeUpdateTask(draggableId, updates);

    try {
      if (!demoMode) await updateTaskStatus(draggableId, newStatus);
      const label = STATUS_CONFIG[newStatus].label;
      toast.success(
        newStatus === "on-hold"
          ? `Moved to "${label}" — Submission locked`
          : newStatus === "done"
            ? `Moved to "${label}" — Graded & locked`
            : `Moved to "${label}"`,
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  // CRUD handlers
  const handleCreate = async (data: Partial<Task>) => {
    try {
      if (!demoMode) {
        const res = await createTask(data);
        setTasks([res.data.task, ...tasks]);
      } else {
        const assignedUser =
          MOCK_USERS.find((u) => u.id === (data as any).assignedTo) ?? user!;
        const newTask: Task = {
          ...(data as Task),
          id: `demo-${Date.now()}`,
          createdBy: user!,
          assignedTo: assignedUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTasks([newTask, ...tasks]);
      }
      toast.success("Task created!");
    } catch {
      toast.error("Failed to create task");
      throw new Error();
    }
  };

  const handleEdit = async (data: Partial<Task>) => {
    const id = editModal.task!.id;
    try {
      if (!demoMode) {
        const res = await updateTask(id, data);
        setTasks(tasks.map((t) => (t.id === id ? res.data.task : t)));
      } else {
        setTasks(
          tasks.map((t) =>
            t.id === id
              ? { ...t, ...data, updatedAt: new Date().toISOString() }
              : t,
          ),
        );
      }
      toast.success("Task updated!");
    } catch {
      toast.error("Failed to update task");
      throw new Error();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    storeDelete(id);
    try {
      if (!demoMode) await deleteTask(id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {user?.role === "student"
                ? user.semester
                  ? `Sem-${user.semester} Task Board`
                  : "Task Board"
                : user?.role === "teacher"
                  ? "Class Task Board"
                  : "Task Board"}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {" · "}
              {user?.role === "student"
                ? `${tasks.filter((t) => t.assignedTo?.id === user.id || t.assignedTo?.email === user.email).length} tasks assigned to you`
                : `${tasks.length} total tasks`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {demoMode ? (
              <button
                onClick={() => {
                  setDemoMode(false);
                  fetchTasks();
                }}
                className="flex items-center gap-1.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium hover:bg-amber-200 dark:hover:bg-amber-900/60 transition"
                title="Exit demo mode and reconnect to backend"
              >
                <FlaskConical size={12} />
                Demo mode — click to exit
              </button>
            ) : (
              <button
                onClick={() => {
                  setDemoMode(true);
                  setTasks(MOCK_TASKS);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-full font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition border border-slate-200 dark:border-slate-700"
                title="Load sample data (demo mode)"
              >
                <FlaskConical size={12} />
                Try demo
              </button>
            )}
            <button
              onClick={fetchTasks}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            {user?.role !== "student" && (
              <button
                onClick={() => setCreateModal({ open: true, status: "todo" })}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-indigo-500/20 dark:shadow-none"
              >
                <Plus size={16} /> New Task
              </button>
            )}
          </div>
        </div>

        {/* Filter chips row */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1 flex-shrink-0">
            Show:
          </span>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const active = filterStatus.includes(s);
            // Count only role-visible tasks for this status
            const count = tasks.filter((t) => {
              const matchRole =
                user?.role !== "student" ||
                t.assignedTo?.id === user.id ||
                t.assignedTo?.email === user.email;
              return t.status === s && matchRole;
            }).length;
            return (
              <button
                key={s}
                onClick={() => toggleStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition flex-shrink-0 ${
                  active
                    ? `${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.darkColor} ${cfg.border} ${cfg.darkBorder}`
                    : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${active ? cfg.dot : "bg-slate-300"}`}
                />
                {cfg.label} {count}
              </button>
            );
          })}
          {overdueCount > 0 && (
            <button
              onClick={() => setFilterOverdue(!filterOverdue)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition flex-shrink-0 ${
                filterOverdue
                  ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800/60"
                  : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-300"
              }`}
            >
              <AlertCircle size={11} /> Overdue {overdueCount}
            </button>
          )}

          {/* Search + subject/semester filter + view toggle */}
          <div className="ml-auto flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-40 sm:w-52 py-1.5 pl-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
            >
              <option value="all">All Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {(user?.role === "teacher" || user?.role === "admin") && (
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-40 sm:w-52 py-1.5 pl-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={String(n)}>
                    Semester {n}
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-40 sm:w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
                placeholder="Search tasks..."
              />
            </div>
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === "board"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <LayoutGrid size={14} /> Board
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <List size={14} /> List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board / List */}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
        {viewMode === "board" ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 items-start p-4 sm:p-6 min-w-max">
              {ALL_STATUSES.filter((s) => filterStatus.includes(s)).map(
                (status) => {
                  const cfg = STATUS_CONFIG[status];
                  const colTasks = filtered.filter((t) => t.status === status);
                  const colLabel =
                    user?.role === "student"
                      ? (cfg.studentLabel ?? cfg.label)
                      : cfg.label;
                  // Tooltip hint per column for students
                  const colHint: Record<TaskStatus, string> = {
                    todo: "Tasks assigned to you",
                    "in-progress": "Tasks you are working on",
                    "on-hold": "Work you have submitted",
                    monitoring: "Under teacher review",
                    done: "Graded & completed",
                  };
                  return (
                    <div
                      key={status}
                      className="flex-shrink-0 w-72 flex flex-col"
                    >
                      {/* Column Header */}
                      <div
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 ${cfg.bg} ${cfg.darkBg} ${cfg.border} ${cfg.darkBorder} border`}
                      >
                        <span
                          className={`text-sm font-bold ${cfg.color} ${cfg.darkColor}`}
                        >
                          {colLabel}
                        </span>
                        <span
                          className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${cfg.dot} text-white`}
                        >
                          {colTasks.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 px-1 mb-2.5">
                        {colHint[status]}
                      </p>

                      {/* Droppable column */}
                      <Droppable
                        droppableId={status}
                        isDropDisabled={
                          user?.role === "student"
                            ? // Students can only drop into in-progress and on-hold
                              status !== "in-progress" && status !== "on-hold"
                            : user?.role === "teacher"
                              ? // Teachers can only drop into monitoring and done
                                status !== "monitoring" && status !== "done"
                              : false // admin — all columns droppable
                        }
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 min-h-32 rounded-xl p-2 space-y-2.5 transition-colors border-2 border-dashed ${
                              snapshot.isDraggingOver
                                ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-700 dark:bg-indigo-950/30"
                                : "border-transparent"
                            }`}
                          >
                            {colTasks.map((task, index) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onEdit={(t) =>
                                  setEditModal({ open: true, task: t })
                                }
                                onDelete={handleDelete}
                                onClick={(t) =>
                                  setDetailModal({ open: true, task: t })
                                }
                              />
                            ))}
                            {provided.placeholder}
                            {colTasks.length === 0 &&
                              !snapshot.isDraggingOver && (
                                <div className="py-8 text-center text-xs text-slate-300 select-none">
                                  No tasks here
                                </div>
                              )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                },
              )}
            </div>
          </DragDropContext>
        ) : (
          /* List View */
          <div className="w-full p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-2">Title</th>
                  <th className="text-left px-4 py-2">Subject</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Due Date</th>
                  <th className="text-left px-4 py-2">Assigned To</th>
                  <th className="text-left px-4 py-2">Marks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const cfg = STATUS_CONFIG[task.status];
                  const typeCfg = task.taskType
                    ? TASK_TYPE_CONFIG[task.taskType]
                    : null;
                  const overdue = isOverdue(task.dueDate, task.status);
                  const isGraded = !!task.gradedAt;
                  return (
                    <tr
                      key={task.id}
                      onClick={() => setDetailModal({ open: true, task })}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition group"
                    >
                      <td className="px-4 py-3 rounded-l-xl font-medium text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{task.title}</span>
                          {overdue && !isGraded && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800/60 px-1.5 py-0.5 rounded-full">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {task.subject || (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {typeCfg && (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${typeCfg.color} ${typeCfg.darkColor}`}
                          >
                            {typeCfg.icon} {typeCfg.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-xs font-medium ${overdue && !isGraded ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                        {task.assignedToGroup ? (
                          <span className="flex items-center gap-1">
                            <Users
                              size={13}
                              className="text-slate-400 flex-shrink-0"
                            />
                            {task.assignedToGroup}
                          </span>
                        ) : (
                          task.assignedTo?.name || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 rounded-r-xl text-sm">
                        {isGraded ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {task.grade}/{task.maxMarks}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-300">
                No tasks found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        open={createModal.open}
        defaultStatus={createModal.status}
        onClose={() => setCreateModal({ open: false, status: "todo" })}
        onSave={handleCreate}
      />
      <TaskModal
        open={editModal.open}
        task={editModal.task}
        onClose={() => setEditModal({ open: false, task: null })}
        onSave={handleEdit}
      />
      <TaskDetailModal
        task={detailModal.task}
        onClose={() => setDetailModal({ open: false, task: null })}
        onAdvance={
          user?.role === "student"
            ? async (t) => {
                await advanceTask(t);
                setDetailModal({ open: false, task: null });
              }
            : undefined
        }
        onReview={
          user?.role === "teacher" || user?.role === "admin"
            ? async (t) => {
                await reviewTask(t);
                setDetailModal({ open: false, task: null });
              }
            : undefined
        }
        onEdit={(t) => {
          setDetailModal({ open: false, task: null });
          setEditModal({ open: true, task: t });
        }}
      />
    </div>
  );
};

export default BoardPage;
