import { Schema, model, Document } from "mongoose";

export type Role = "student" | "teacher" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  groupId?: string;
  semester?: number;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher", "admin"], required: true },
    groupId: { type: String },
    semester: { type: Number, min: 1, max: 8 },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
