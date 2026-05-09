import { Router, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Task } from "../models/Task";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const safeUser = (u: InstanceType<typeof User>) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  groupId: u.groupId,
  semester: u.semester,
});

// GET /api/users  (admin + teacher — teachers need student list to assign tasks)
router.get(
  "/",
  requireRole("admin", "teacher"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    res.json({ users: users.map(safeUser) });
  },
);

// DELETE /api/users/:id  (admin only — cannot delete self)
router.delete(
  "/:id",
  requireRole("admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    if (String(req.user!._id) === req.params.id) {
      res.status(400).json({ message: "Cannot delete your own account" });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Remove all tasks assigned to or created by the user
    await Task.deleteMany({
      $or: [{ "assignedTo._id": user._id }, { "createdBy._id": user._id }],
    });

    await user.deleteOne();
    res.json({ message: "User and associated tasks deleted" });
  },
);

export default router;
