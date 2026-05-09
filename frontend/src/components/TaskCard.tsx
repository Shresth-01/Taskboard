import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
  AlertCircle,
  Calendar,
  Trash2,
  User,
  Users,
  Lock,
  Star,
} from "lucide-react";
import type { Task } from "../types";
import { TASK_TYPE_CONFIG, STATUS_CONFIG } from "../types";
import { useAuthStore } from "../store/authStore";

interface Props {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}

const isOverdue = (dueDate: string, status: string) => {
  if (status === "done") return false;
  return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const TaskCard: React.FC<Props> = ({ task, index, onDelete, onClick }) => {
  const { user } = useAuthStore();
  const overdue = isOverdue(task.dueDate, task.status);
  const isLocked = !!task.submittedAt || !!task.gradedAt;
  const isGraded = !!task.gradedAt;
  const typeCfg = task.taskType ? TASK_TYPE_CONFIG[task.taskType] : null;
  const statusCfg = STATUS_CONFIG[task.status];
  const borderLeft =
    overdue && !isGraded ? "border-l-red-400" : statusCfg.borderLeft;

  const canDelete =
    user?.role === "admin" ||
    (user?.role === "teacher" &&
      user.id === task.createdBy?.id &&
      !task.submittedAt);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`
            bg-white dark:bg-slate-800 rounded-xl border border-l-[3px] select-none group transition-all duration-150
            ${isLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing"}
            border-slate-200 dark:border-t-slate-700 dark:border-r-slate-700 dark:border-b-slate-700 ${borderLeft}
            ${snapshot.isDragging ? "shadow-xl rotate-1 scale-[1.02] opacity-90" : "shadow-sm hover:shadow-md hover:-translate-y-0.5"}
          `}
          style={provided.draggableProps.style}
        >
          {/* Card body */}
          <div
            className="p-3 flex flex-col"
            style={{ minHeight: isGraded ? undefined : 120 }}
          >
            {/* Type + lock/overdue badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {typeCfg && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${typeCfg.color} ${typeCfg.darkColor}`}
                >
                  {typeCfg.label}
                </span>
              )}
              {isLocked && (
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Lock size={9} />
                </span>
              )}
              {!isLocked && overdue && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800/60 px-1.5 py-0.5 rounded-full">
                  <AlertCircle size={9} /> Overdue
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className={`font-semibold text-[13px] leading-snug mb-2.5 line-clamp-2 ${isGraded ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}`}
            >
              {task.title}
            </h3>

            {/* Grade result (graded) */}
            {isGraded && task.grade !== undefined && (
              <div className="flex items-center gap-1.5 mb-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-lg px-2 py-1.5">
                <Star size={11} className="text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {task.grade}/{task.maxMarks ?? 100}
                </span>
                {task.feedback && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {task.feedback}
                  </span>
                )}
              </div>
            )}

            {/* Semester badge — teacher/admin only — always reserve space */}
            {(user?.role === "teacher" || user?.role === "admin") && (
              <div className="mb-2 h-5">
                {task.semester ? (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                    Sem {task.semester}
                  </span>
                ) : null}
              </div>
            )}

            {/* Footer row: assignee + date + actions */}
            <div className="flex items-center justify-between gap-2 mt-auto">
              <div className="flex items-center gap-1.5 min-w-0">
                {task.assignedToGroup ? (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Users size={8} className="text-slate-500" />
                    </span>
                    {task.assignedToGroup}
                  </span>
                ) : task.assignedTo ? (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <User size={8} className="text-indigo-500" />
                    </span>
                    {task.assignedTo.name}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-[11px] flex items-center gap-0.5 ${overdue && !isGraded ? "text-red-400" : "text-slate-400"}`}
                >
                  <Calendar size={10} />
                  {formatDate(task.dueDate)}
                </span>
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canDelete &&
                    (user?.role === "admin" ||
                      task.status === "todo" ||
                      task.status === "in-progress") && (
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
