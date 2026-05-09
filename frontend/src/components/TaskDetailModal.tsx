import React, { useState } from "react";
import {
  X,
  Calendar,
  User,
  Tag,
  Clock,
  AlertCircle,
  Lock,
  ExternalLink,
  Star,
  Users,
  TrendingDown,
  MessageSquare,
  Upload,
  FileText,
  GitBranch,
  Link2,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import type { Task } from "../types";
import { STATUS_CONFIG, TASK_TYPE_CONFIG } from "../types";
import { useAuthStore } from "../store/authStore";

interface Props {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onAdvance?: (task: Task) => void;
  onReview?: (task: Task) => void;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const isOverdue = (d: string, status: string) =>
  status !== "done" && new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));

const TaskDetailModal: React.FC<Props> = ({
  task,
  onClose,
  onEdit,
  onAdvance,
  onReview,
}) => {
  const { user } = useAuthStore();
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionOpen, setSubmissionOpen] = useState(false);
  if (!task) return null;

  const cfg = STATUS_CONFIG[task.status];
  const typeCfg = task.taskType ? TASK_TYPE_CONFIG[task.taskType] : null;
  const overdue = isOverdue(task.dueDate, task.status);
  const isLocked = !!task.submittedAt || !!task.gradedAt;
  const isGraded = !!task.gradedAt;

  const canStudentAdvance =
    user?.role === "student" &&
    !isLocked &&
    (task.assignedTo?.id === user.id ||
      task.assignedTo?.email === user.email) &&
    (task.status === "todo" || task.status === "in-progress");

  // Overdue penalty: 5% deducted per day overdue (capped at 25%)
  const daysOverdue =
    overdue && !isGraded
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(task.dueDate).getTime()) / 86400000,
          ),
        )
      : 0;
  const penaltyPct = Math.min(daysOverdue * 5, 30);

  const canEdit =
    !isGraded && (user?.role === "admin" || user?.role === "teacher");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex-1 mr-4">
            {/* Breadcrumb-style: Type > Status */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 flex-wrap">
              {typeCfg && (
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md ${typeCfg.color} ${typeCfg.darkColor}`}
                >
                  {typeCfg.icon} {typeCfg.label}
                </span>
              )}
              {typeCfg && <span className="text-slate-300">/</span>}
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.darkColor}`}
              >
                {cfg.label}
              </span>
              {isLocked && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">
                    <Lock size={10} /> {isGraded ? "Graded" : "Submitted"}
                  </span>
                </>
              )}
            </div>
            {/* Title + overdue tag inline */}
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 min-w-0">
              <span className="truncate">{task.title}</span>
              {overdue && !isGraded && (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800/60 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                  <AlertCircle size={10} /> Overdue
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overdue penalty notice */}
        {overdue && !isGraded && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2.5">
            <TrendingDown
              size={14}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-red-700 dark:text-red-400 leading-snug">
              <strong>Late submission penalty:</strong> {daysOverdue} day
              {daysOverdue !== 1 ? "s" : ""} overdue —{" "}
              <strong>{penaltyPct}% marks may be deducted</strong> as per
              grading policy (5% per day, max 30%).
            </p>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Instructions
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Quiz Link */}
          {task.quizLink && (
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 rounded-xl p-3">
              <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wider mb-1.5">
                Quiz Link
              </p>
              <a
                href={task.quizLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} />
                {task.quizLink}
              </a>
              {task.submittedAt && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Lock size={10} /> Link locked after submission
                </p>
              )}
            </div>
          )}

          {/* Grade result (if graded) */}
          {isGraded && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Star size={11} /> Grade
              </p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {task.grade}{" "}
                <span className="text-base font-medium text-emerald-500 dark:text-emerald-500">
                  / {task.maxMarks ?? 100}
                </span>
              </p>
              {task.feedback && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 border-t border-emerald-100 dark:border-emerald-900 pt-2 flex items-start gap-1.5">
                  <MessageSquare
                    size={13}
                    className="text-emerald-500 flex-shrink-0 mt-0.5"
                  />
                  <em>{task.feedback}</em>
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Graded on {formatDate(task.gradedAt!)}
              </p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar size={11} /> Due Date
              </p>
              <p
                className={`text-sm font-medium ${overdue && !isGraded ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}
              >
                {formatDate(task.dueDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                {task.assignedToGroup ? (
                  <Users size={11} />
                ) : (
                  <User size={11} />
                )}{" "}
                Assigned To
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {task.assignedToGroup ? (
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-slate-400" />
                    {task.assignedToGroup}
                  </span>
                ) : (
                  task.assignedTo?.name || "—"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User size={11} /> Created By
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {task.createdBy?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={11} /> Last Updated
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(task.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {(task.subject || (!isGraded && task.maxMarks)) && (
              <>
                {task.subject && (
                  <div
                    className={!isGraded && task.maxMarks ? "" : "col-span-2"}
                  >
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <BookOpen size={11} /> Subject
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {task.subject}
                    </p>
                  </div>
                )}
                {!isGraded && task.maxMarks && (
                  <div className={!task.subject ? "col-span-2" : ""}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Star size={11} className="text-amber-500" /> Max Marks
                    </p>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {task.maxMarks}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Submission section — accordion for students on in-progress tasks */}
          {user?.role === "student" &&
            !isLocked &&
            canStudentAdvance &&
            task.status === "in-progress" && (
              <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden">
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => setSubmissionOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/50 border-b border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 transition"
                >
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    {task.taskType === "quiz"
                      ? "Attempt Quiz"
                      : task.taskType === "assignment"
                        ? "Submit Assignment"
                        : task.taskType === "project"
                          ? "Submit Project"
                          : "Submit Presentation"}
                  </p>
                  <ChevronDown
                    size={15}
                    className={`text-indigo-500 dark:text-indigo-400 transition-transform duration-200 ${submissionOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {/* Accordion body */}
                {submissionOpen && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-800">
                    {task.taskType === "quiz" ? (
                      /* Quiz — open the link */
                      task.quizLink ? (
                        <a
                          href={task.quizLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition"
                        >
                          <ExternalLink size={14} /> Attempt Quiz
                        </a>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">
                          No quiz link provided by teacher.
                        </p>
                      )
                    ) : task.taskType === "project" ? (
                      /* Project — GitHub/live link or file */
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <GitBranch size={12} /> Repository / Live Link
                          </label>
                          <input
                            type="url"
                            value={submissionLink}
                            onChange={(e) => setSubmissionLink(e.target.value)}
                            placeholder="https://github.com/you/project"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Upload size={12} /> Report / Documentation (PDF,
                            DOC, DOCX, ZIP)
                          </label>
                          <label className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition text-xs text-slate-500 dark:text-slate-400">
                            <Upload size={13} />
                            {submissionFile
                              ? submissionFile.name
                              : "Click to upload file"}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.zip,.rar"
                              className="hidden"
                              onChange={(e) =>
                                setSubmissionFile(e.target.files?.[0] ?? null)
                              }
                            />
                          </label>
                        </div>
                      </>
                    ) : task.taskType === "presentation" ? (
                      /* Presentation — slides file or link */
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Link2 size={12} /> Slides Link (Google Slides /
                            Canva)
                          </label>
                          <input
                            type="url"
                            value={submissionLink}
                            onChange={(e) => setSubmissionLink(e.target.value)}
                            placeholder="https://slides.google.com/..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Upload size={12} /> Upload Slides (PPT, PDF, DOC,
                            DOCX)
                          </label>
                          <label className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition text-xs text-slate-500 dark:text-slate-400">
                            <Upload size={13} />
                            {submissionFile
                              ? submissionFile.name
                              : "Click to upload file"}
                            <input
                              type="file"
                              accept=".ppt,.pptx,.pdf,.doc,.docx"
                              className="hidden"
                              onChange={(e) =>
                                setSubmissionFile(e.target.files?.[0] ?? null)
                              }
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      /* Assignment — PDF/Word upload */
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <FileText size={12} /> Upload File (PDF, DOC, DOCX)
                          </label>
                          <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition text-sm text-slate-500 dark:text-slate-400">
                            <Upload size={14} />
                            {submissionFile
                              ? submissionFile.name
                              : "Click to upload your work"}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              onChange={(e) =>
                                setSubmissionFile(e.target.files?.[0] ?? null)
                              }
                            />
                          </label>
                          {submissionFile && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                              <FileText size={11} /> {submissionFile.name} ready
                              to submit
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Submission info */}
          {task.submittedAt && (
            <p className="text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl px-3 py-2 flex items-center gap-1">
              <Lock size={10} /> Submitted on {formatDate(task.submittedAt)}
            </p>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag size={11} /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          {canStudentAdvance && onAdvance ? (
            <button
              onClick={() => {
                onAdvance(task);
                onClose();
              }}
              disabled={
                task.status === "in-progress" &&
                task.taskType !== "quiz" &&
                !submissionFile &&
                !submissionLink.trim()
              }
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition min-w-[110px] text-center"
            >
              {task.status === "in-progress" ? "Submit Task" : "Start Task"}
            </button>
          ) : canEdit && task.status === "on-hold" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onReview?.(task);
                  onClose();
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition min-w-[110px] text-center"
              >
                Start Review
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(task);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition min-w-[110px] text-center"
                >
                  Edit Task
                </button>
              )}
            </div>
          ) : canEdit && task.status === "monitoring" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition min-w-[110px] text-center"
              >
                Grade Task
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(task);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition min-w-[110px] text-center"
                >
                  Edit Task
                </button>
              )}
            </div>
          ) : canEdit ? (
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition min-w-[110px] text-center"
            >
              Edit Task
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition min-w-[110px] text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
