import { Router, Response } from "express";
import { body, query, validationResult } from "express-validator";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { Types } from "mongoose";

const router = Router();
router.use(authenticate);

// Serialize a task document to match the frontend's Task shape
const serializeTask = (t: InstanceType<typeof Task>) => ({
  id: String(t._id),
  title: t.title,
  description: t.description,
  taskType: t.taskType,
  status: t.status,
  priority: t.priority,
  dueDate: t.dueDate.toISOString(),
  tags: t.tags,
  assignedTo: {
    id: String(t.assignedTo._id),
    name: t.assignedTo.name,
    email: t.assignedTo.email,
    role: t.assignedTo.role,
    groupId: t.assignedTo.groupId,
    semester: t.assignedTo.semester,
  },
  assignedToGroup: t.assignedToGroup,
  createdBy: {
    id: String(t.createdBy._id),
    name: t.createdBy.name,
    email: t.createdBy.email,
    role: t.createdBy.role,
  },
  quizLink: t.quizLink,
  maxMarks: t.maxMarks,
  grade: t.grade,
  feedback: t.feedback,
  semester: t.semester,
  subject: t.subject,
  submittedAt: t.submittedAt?.toISOString(),
  gradedAt: t.gradedAt?.toISOString(),
  createdAt: (t as any).createdAt?.toISOString(),
  updatedAt: (t as any).updatedAt?.toISOString(),
});

// GET /api/tasks
// Students see only their own tasks; teachers/admins see all.
// Optional query params: status, semester, subject
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, semester, subject } = req.query as Record<
    string,
    string | undefined
  >;
  const filter: Record<string, unknown> = {};

  if (req.user!.role === "student") {
    filter["assignedTo._id"] = req.user!._id;
  }
  if (status) filter.status = status;
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = subject;

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json({ tasks: tasks.map(serializeTask) });
});

// POST /api/tasks  (teacher / admin only)
router.post(
  "/",
  requireRole("teacher", "admin"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("taskType")
      .isIn(["assignment", "quiz", "project", "presentation"])
      .withMessage("Invalid task type"),
    body("dueDate").isISO8601().withMessage("Valid due date required"),
    body("maxMarks")
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage("Max marks must be between 1 and 30"),
    body("grade")
      .optional()
      .isInt({ min: 0, max: 30 })
      .withMessage("Grade must be between 0 and 30"),
    body("assignedTo").notEmpty().withMessage("assignedTo is required"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      title,
      description,
      taskType,
      priority,
      dueDate,
      tags,
      assignedTo: assignedToId,
      assignedToGroup,
      quizLink,
      maxMarks,
      subject,
      semester,
    } = req.body;

    // Resolve assignee
    const assignee = await User.findById(assignedToId);
    if (!assignee) {
      res.status(404).json({ message: "Assigned user not found" });
      return;
    }

    const task = await Task.create({
      title,
      description: description ?? "",
      taskType,
      status: "todo",
      priority: priority ?? "medium",
      dueDate,
      tags: tags ?? [],
      assignedTo: {
        _id: assignee._id,
        name: assignee.name,
        email: assignee.email,
        role: assignee.role,
        groupId: assignee.groupId,
        semester: assignee.semester,
      },
      assignedToGroup: assignedToGroup ?? undefined,
      createdBy: {
        _id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
      },
      quizLink: quizLink ?? undefined,
      maxMarks: maxMarks ?? undefined,
      subject: subject ?? undefined,
      semester: semester ? Number(semester) : undefined,
    });

    res.status(201).json({ task: serializeTask(task) });
  },
);

// PUT /api/tasks/:id  (teacher / admin — edit task fields)
router.put(
  "/:id",
  requireRole("teacher", "admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // If grading, only allow grade/feedback/status fields
    const {
      title,
      description,
      taskType,
      priority,
      dueDate,
      tags,
      assignedTo: assignedToId,
      assignedToGroup,
      quizLink,
      maxMarks,
      subject,
      semester,
      status,
      grade,
      feedback,
      gradedAt,
    } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (taskType !== undefined) task.taskType = taskType;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);
    if (tags !== undefined) task.tags = tags;
    if (assignedToGroup !== undefined) task.assignedToGroup = assignedToGroup;
    if (quizLink !== undefined) task.quizLink = quizLink;
    if (maxMarks !== undefined) task.maxMarks = maxMarks;
    if (subject !== undefined) task.subject = subject;
    if (semester !== undefined) task.semester = Number(semester);
    if (status !== undefined) task.status = status;

    // Grade fields
    if (grade !== undefined) task.grade = Number(grade);
    if (feedback !== undefined) task.feedback = feedback;
    if (gradedAt !== undefined) task.gradedAt = new Date(gradedAt);

    // Resolve new assignee if changed
    if (assignedToId && String(task.assignedTo._id) !== String(assignedToId)) {
      const assignee = await User.findById(assignedToId);
      if (!assignee) {
        res.status(404).json({ message: "Assigned user not found" });
        return;
      }
      task.assignedTo = {
        _id: assignee._id as Types.ObjectId,
        name: assignee.name,
        email: assignee.email,
        role: assignee.role,
        groupId: assignee.groupId,
        semester: assignee.semester,
      };
    }

    await task.save();
    res.json({ task: serializeTask(task) });
  },
);

// PATCH /api/tasks/:id/status  (status transitions — validated per role)
router.patch(
  "/:id/status",
  [body("status").notEmpty().withMessage("status is required")],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const { status } = req.body as { status: string };
    const role = req.user!.role;

    // Student transition rules
    const STUDENT_ALLOWED: Record<string, string> = {
      todo: "in-progress",
      "in-progress": "on-hold",
    };
    // Teacher/admin transition rules
    const TEACHER_ALLOWED: Record<string, string> = {
      "on-hold": "monitoring",
      monitoring: "done",
    };

    if (role === "student") {
      // Must be the assigned student
      if (String(task.assignedTo._id) !== String(req.user!._id)) {
        res.status(403).json({ message: "Cannot move another student's task" });
        return;
      }
      if (task.submittedAt) {
        res.status(409).json({ message: "Task is locked after submission" });
        return;
      }
      if (STUDENT_ALLOWED[task.status] !== status) {
        res
          .status(422)
          .json({
            message: `Invalid transition: students can only move Assigned → In Progress → Submitted`,
          });
        return;
      }
    } else if (role === "teacher") {
      // Teacher — can only do teacher-side transitions
      if (task.gradedAt) {
        res.status(409).json({ message: "Task is graded and locked" });
        return;
      }
      if (TEACHER_ALLOWED[task.status] !== status) {
        res
          .status(422)
          .json({
            message: `Invalid transition: teachers can only move Submitted → Under Review → Graded`,
          });
        return;
      }
    }
    // admin — no restrictions, can move to any status

    task.status = status as typeof task.status;
    if (status === "on-hold") task.submittedAt = new Date();
    if (status === "done") task.gradedAt = new Date();

    await task.save();
    res.json({ task: serializeTask(task) });
  },
);

// DELETE /api/tasks/:id  (teacher who created it, or admin)
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const role = req.user!.role;
    const isCreator = String(task.createdBy._id) === String(req.user!._id);

    if (role === "student") {
      res.status(403).json({ message: "Students cannot delete tasks" });
      return;
    }
    if (role === "teacher" && (!isCreator || task.submittedAt)) {
      res
        .status(403)
        .json({
          message: "Cannot delete a submitted task or one you did not create",
        });
      return;
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  },
);

export default router;
