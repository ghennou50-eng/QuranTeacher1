const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const schoolRoutes = require("./routes/schoolRoutes");
const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const progressRoutes = require("./routes/progressRoutes");
const parentRoutes = require("./routes/parentRoutes");

const pool = require("./database");

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;

/* =========================
   Environment Variables
========================= */

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing from the server environment."
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing from the server environment."
  );
}

/* =========================
   Middleware
========================= */

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://quranteacher1-1.onrender.com"
    ],
    credentials: true
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

/* =========================
   Uploaded Files
========================= */

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

/* =========================
   Health Check
========================= */

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time"
    );

    res.status(200).json({
      success: true,
      message: "Quran Teacher API is running",
      database: "connected",
      databaseTime: result.rows[0].database_time
    });
  } catch (error) {
    console.error(
      "Database health check failed:",
      error
    );

    res.status(503).json({
      success: false,
      message: "تعذر الاتصال بقاعدة البيانات.",
      database: "disconnected"
    });
  }
});

/* =========================
   API Routes
========================= */

app.use(
  "/api/schools",
  schoolRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/teachers",
  teacherRoutes
);

app.use(
  "/api/students",
  studentRoutes
);

app.use(
  "/api/attendance",
  attendanceRoutes
);

app.use(
  "/api/progress",
  progressRoutes
);

app.use(
  "/api/parent",
  parentRoutes
);

/* =========================
   404 Handler
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "المسار المطلوب غير موجود."
  });
});

/* =========================
   Error Handler
========================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي في الخادم."
    });
  }
);

/* =========================
   Start Server
========================= */

const server = app.listen(
  PORT,
  () => {
    console.log(
      `Quran Teacher server is running on port ${PORT}`
    );
    console.log(
      `Health check: http://localhost:${PORT}/api/health`
    );
  }
);

/* =========================
   Graceful Shutdown
========================= */

const shutdown = async () => {
  console.log(
    "Shutting down server..."
  );

  try {
    await pool.end();

    console.log(
      "Database connection closed."
    );
  } catch (error) {
    console.error(
      "Database shutdown error:",
      error
    );
  }

  server.close(() => {
    process.exit(0);
  });
};

process.on(
  "SIGINT",
  shutdown
);

process.on(
  "SIGTERM",
  shutdown
);
