import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Eye, EyeOff, CheckSquare } from "lucide-react";
import { login } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTaskStore } from "../store/taskStore";
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const { setDemoMode, setTasks } = useTaskStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const DEMO_ACCOUNTS = [
    {
      email: "student@demo.com",
      password: "demo123",
      user: {
        id: "u2",
        name: "Student Demo",
        email: "student@demo.com",
        role: "student" as const,
      },
    },
    {
      email: "teacher@demo.com",
      password: "demo123",
      user: {
        id: "u1",
        name: "Teacher Demo",
        email: "teacher@demo.com",
        role: "teacher" as const,
      },
    },
    {
      email: "admin@demo.com",
      password: "demo123",
      user: {
        id: "u3",
        name: "Admin Demo",
        email: "admin@demo.com",
        role: "admin" as const,
      },
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      loginStore(res.data.user, res.data.token);
      setDemoMode(false);
      setTasks([]);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate("/board");
    } catch {
      // Backend offline — try demo accounts
      const demo = DEMO_ACCOUNTS.find(
        (a) => a.email === email && a.password === password,
      );
      if (demo) {
        loginStore(demo.user, "demo-token-" + demo.user.role);
        setDemoMode(true);
        toast.success(`Welcome, ${demo.user.name}! (Demo mode)`);
        navigate("/board");
      } else {
        toast.error("Invalid credentials. Try the demo buttons below.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo login shortcuts
  const demoLogin = async (role: "student" | "teacher" | "admin") => {
    const creds = {
      student: {
        email: "student@demo.com",
        password: "demo123",
        user: {
          id: "u2",
          name: "Student Demo",
          email: "student@demo.com",
          role: "student" as const,
        },
      },
      teacher: {
        email: "teacher@demo.com",
        password: "demo123",
        user: {
          id: "u1",
          name: "Teacher Demo",
          email: "teacher@demo.com",
          role: "teacher" as const,
        },
      },
      admin: {
        email: "admin@demo.com",
        password: "demo123",
        user: {
          id: "u3",
          name: "Admin Demo",
          email: "admin@demo.com",
          role: "admin" as const,
        },
      },
    };
    const { user } = creds[role];
    loginStore(user, "demo-token-" + role);
    setDemoMode(true);
    toast.success(`Welcome, ${user.name}! (Demo mode)`);
    navigate("/board");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <CheckSquare className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            TaskBoard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Sign in to your workspace
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-800 dark:text-slate-100 placeholder-slate-400"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-800 dark:text-slate-100 placeholder-slate-400 pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition shadow-md shadow-indigo-500/20 dark:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div className="mt-6">
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-3">
              Quick demo access
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["student", "teacher", "admin"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => demoLogin(role)}
                  className="py-1.5 px-2 text-xs font-medium bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600 capitalize transition"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            No account?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
