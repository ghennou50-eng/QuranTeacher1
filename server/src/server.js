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

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

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
   Automatic School Approval
   ========================= */

let autoApprovalEnabled = true;
let autoApprovalRunning = false;

const autoApprovePendingSchool = async () => {
  if (!autoApprovalEnabled) {
    return;
  }

  if (autoApprovalRunning) {
    return;
  }

  autoApprovalRunning = true;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `
      SELECT *
      FROM school_requests
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
      `
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return;
    }

    const request = requestResult.rows[0];

    const existingSchool = await client.query(
      `
      SELECT id
      FROM schools
      WHERE phone = $1
      LIMIT 1
      `,
      [request.phone]
    );

    if (existingSchool.rows.length > 0) {
      await client.query("ROLLBACK");
      return;
    }

    const userResult = await client.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        role,
        is_active
      )
      VALUES (
        $1,
        $2,
        'school',
        TRUE
      )
      RETURNING id
      `,
      [
        request.phone,
        request.password_hash
      ]
    );

    const userId = userResult.rows[0].id;

    await client.query(
      `
      INSERT INTO schools (
        user_id,
        association_name,
        club_name,
        phone,
        wilaya,
        municipality,
        district,
        inside_image_url,
        outside_image_url
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
      `,
      [
        userId,
        request.association_name,
        request.club_name,
        request.phone,
        request.wilaya,
        request.municipality,
        request.district,
        request.inside_image_url,
        request.outside_image_url
      ]
    );

    await client.query(
      `
      UPDATE school_requests
      SET
        status = 'approved',
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND status = 'pending'
      `,
      [request.id]
    );

    await client.query("COMMIT");

    console.log(
      `Automatically approved school request ${request.id}`
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Automatic approval rollback error:",
        rollbackError
      );
    }

    console.error(
      "Automatic school approval error:",
      error
    );
  } finally {
    client.release();
    autoApprovalRunning = false;
  }
};

/* =========================
   Auto Approval Control API
   ========================= */

app.get(
  "/api/schools/auto-approval",
  (req, res) => {
    res.json({
      success: true,
      enabled: autoApprovalEnabled
    });
  }
);

app.post(
  "/api/schools/auto-approval",
  (req, res) => {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "enabled must be boolean"
      });
    }

    autoApprovalEnabled = enabled;

    console.log(
      `Automatic school approval ${
        enabled ? "ENABLED" : "DISABLED"
      }`
    );

    return res.json({
      success: true,
      enabled: autoApprovalEnabled
    });
  }
);

const autoApprovalInterval = setInterval(
  autoApprovePendingSchool,
  5000
);

void autoApprovePendingSchool();

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "المسار المطلوب غير موجود."
  });
});

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

const shutdown = async () => {
  console.log(
    "Shutting down server..."
  );

  clearInterval(autoApprovalInterval);

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
