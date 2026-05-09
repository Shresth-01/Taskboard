/**
 * One-time seed script — creates default users if they don't exist.
 * Run with:  npx ts-node src/seed.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import connectDB from "./config/db";
import { User } from "./models/User";

const SEED_USERS = [
  {
    name: "Admin",
    email: "admin@taskboard.com",
    password: "Admin@123",
    role: "admin" as const,
  },
  {
    name: "Dr. Priya Sharma",
    email: "teacher@taskboard.com",
    password: "Teacher@123",
    role: "teacher" as const,
  },
  {
    name: "Rahul Verma",
    email: "student@taskboard.com",
    password: "Student@123",
    role: "student" as const,
    semester: 3,
    groupId: "G1",
  },
];

(async () => {
  await connectDB();

  for (const u of SEED_USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`⚠  Skipped (already exists): ${u.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 12);
    await User.create({ ...u, passwordHash });
    console.log(`✓  Created ${u.role}: ${u.email}  (password: ${u.password})`);
  }

  console.log("\nSeeding complete.");
  process.exit(0);
})();
