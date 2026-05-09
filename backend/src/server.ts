import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";

const PORT = Number(process.env.PORT ?? 5000);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
