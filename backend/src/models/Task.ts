import { Schema, model, Document, Types } from "mongoose";

export type TaskStatus =
  | "todo"
  | "in-progress"
  | "on-hold"
  | "monitoring"
  | "done";
export type Priority = "low" | "medium" | "high";
export type TaskType = "assignment" | "quiz" | "project" | "presentation";

// Embedded user snapshot (denormalised for read performance)
const userSnapshotSchema = new Schema(
  {
    _id: { type: Types.ObjectId, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    groupId: { type: String },
    semester: { type: Number },
  },
  { _id: false },
);

export interface ITask extends Document {
  title: string;
  description: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date;
  tags: string[];
  assignedTo: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
    groupId?: string;
    semester?: number;
  };
  assignedToGroup?: string;
  createdBy: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
  };
  quizLink?: string;
  maxMarks?: number;
  grade?: number;
  feedback?: string;
  semester?: number;
  subject?: string;
  submittedAt?: Date;
  gradedAt?: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    taskType: {
      type: String,
      enum: ["assignment", "quiz", "project", "presentation"],
      required: true,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "on-hold", "monitoring", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date, required: true },
    tags: [{ type: String }],
    assignedTo: { type: userSnapshotSchema, required: true },
    assignedToGroup: { type: String },
    createdBy: { type: userSnapshotSchema, required: true },
    quizLink: { type: String },
    maxMarks: { type: Number, min: 0, max: 30 },
    grade: { type: Number, min: 0, max: 30 },
    feedback: { type: String, maxlength: 1000 },
    semester: { type: Number, min: 1, max: 8 },
    subject: { type: String },
    submittedAt: { type: Date },
    gradedAt: { type: Date },
  },
  { timestamps: true },
);

// Indexes for common query patterns
taskSchema.index({ "assignedTo._id": 1, status: 1 });
taskSchema.index({ "createdBy._id": 1 });
taskSchema.index({ semester: 1, subject: 1 });

export const Task = model<ITask>("Task", taskSchema);
