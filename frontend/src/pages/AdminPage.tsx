import React, { useEffect, useState } from "react";
import { Trash2, Users, CheckSquare, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getUsers, deleteUser, getTasks } from "../services/api";
import { useTaskStore } from "../store/taskStore";
import type { User } from "../types";
import { STATUS_CONFIG, ALL_STATUSES } from "../types";
import { MOCK_USERS, MOCK_TASKS } from "../data/mockData";

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { tasks, setTasks, demoMode } = useTaskStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoMode) {
      setUsers(MOCK_USERS);
      if (tasks.length === 0) setTasks(MOCK_TASKS);
      setLoading(false);
      return;
    }
    Promise.all([getUsers(), getTasks()])
      .then(([uRes, tRes]) => {
        setUsers(uRes.data.users || []);
        setTasks(tRes.data.tasks || []);
      })
      .catch(() => {
        setUsers(MOCK_USERS);
        setTasks(MOCK_TASKS);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted");
    } catch {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User removed (demo)");
    }
  };

  const roleBadge: Record<string, string> = {
    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    teacher:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    admin:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };

  // Stats
  const stats = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/50",
    },
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: CheckSquare,
      color:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-900/50",
    },
    {
      label: "In Progress",
      value: tasks.filter((t) => t.status === "in-progress").length,
      icon: Clock,
      color:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/50",
    },
    {
      label: "Overdue",
      value: tasks.filter(
        (t) => t.status !== "done" && new Date(t.dueDate) < new Date(),
      ).length,
      icon: AlertCircle,
      color: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
      border: "border-red-100 dark:border-red-900/50",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage users and view system overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, border }) => (
          <div
            key={label}
            className={`bg-white dark:bg-slate-800 rounded-2xl border ${border} p-5 flex items-center gap-4 shadow-sm`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
            >
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {value}
              </p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task breakdown by status */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4">
          Tasks by Status
        </h2>
        <div className="space-y-3">
          {ALL_STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const count = tasks.filter((t) => t.status === status).length;
            const pct = tasks.length
              ? Math.round((count / tasks.length) * 100)
              : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold w-24 flex-shrink-0 ${cfg.color}`}
                >
                  {cfg.label}
                </span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${cfg.dot} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">
            All Users
          </h2>
          <span className="text-xs text-slate-400">{users.length} total</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-slate-300 dark:text-slate-600">
            Loading...
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${roleBadge[u.role]}`}
                  >
                    {u.role}
                  </span>
                  <span className="text-xs text-slate-400">
                    {tasks.filter((t) => t.assignedTo?.id === u.id).length}{" "}
                    tasks
                  </span>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
