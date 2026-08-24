const express = require("express");

const pool = require("../database");
const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
  التحقق من أن الطالب تابع للمعلم الحالي
*/
async function verifyTeacherStudent(
  client,
  teacherId,
  studentId
) {
  const result = await client.query(
    `
    SELECT
      s.id,
      s.school_id,
      s.teacher_id
    FROM students s
    WHERE s.id = $1
      AND s.teacher_id = $2
    LIMIT 1
    `,
    [studentId, teacherId]
  );

  return result.rows[0] || null;
}

/*
  GET /api/attendance?date=YYYY-MM-DD&period=morning

  يجلب حضور جميع طلاب المعلم في يوم وفترة محددين.
*/
router.get(
  "/",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const date =
        req.query.date;

      const period =
        req.query.period;

      if (!date || !period) {
        return res.status(400).json({
          success: false,
          message:
            "يجب تحديد التاريخ والفترة."
        });
      }

      if (
        period !== "morning" &&
        period !== "evening"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "الفترة غير صالحة."
        });
      }

      const result =
        await client.query(
          `
          SELECT
            a.id,
            a.student_id,
            a.attendance_date,
            a.period,
            a.present
          FROM attendance a
          INNER JOIN students s
            ON s.id = a.student_id
          WHERE s.teacher_id = $1
            AND a.attendance_date = $2
            AND a.period = $3
          ORDER BY a.student_id
          `,
          [
            teacherId,
            date,
            period
          ]
        );

      return res.status(200).json({
        success: true,
        attendance:
          result.rows
      });
    } catch (error) {
      console.error(
        "Get attendance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر جلب بيانات الحضور."
      });
    } finally {
      client.release();
    }
  }
);

/*
  POST /api/attendance

  تسجيل أو تعديل حضور طالب.
*/
router.post(
  "/",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const {
        studentId,
        date,
        period,
        present
      } = req.body;

      if (
        !studentId ||
        !date ||
        !period ||
        typeof present !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "بيانات الحضور غير مكتملة."
        });
      }

      if (
        period !== "morning" &&
        period !== "evening"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "الفترة غير صالحة."
        });
      }

      await client.query(
        "BEGIN"
      );

      const student =
        await verifyTeacherStudent(
          client,
          teacherId,
          studentId
        );

      if (!student) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(403).json({
          success: false,
          message:
            "لا تملك صلاحية تسجيل حضور هذا الطالب."
        });
      }

      const result =
        await client.query(
          `
          INSERT INTO attendance (
            student_id,
            attendance_date,
            period,
            present
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          ON CONFLICT (
            student_id,
            attendance_date,
            period
          )
          DO UPDATE SET
            present = EXCLUDED.present
          RETURNING
            id,
            student_id,
            attendance_date,
            period,
            present
          `,
          [
            studentId,
            date,
            period,
            present
          ]
        );

      await client.query(
        "COMMIT"
      );

      return res.status(200).json({
        success: true,
        message:
          "تم حفظ الحضور.",
        attendance:
          result.rows[0]
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Attendance rollback error:",
          rollbackError
        );
      }

      console.error(
        "Save attendance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حفظ الحضور."
      });
    } finally {
      client.release();
    }
  }
);

/*
  DELETE /api/attendance/:id

  حذف سجل حضور محدد للطالب.
*/
router.delete(
  "/:id",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const attendanceId =
        req.params.id;

      const result =
        await client.query(
          `
          DELETE FROM attendance a
          USING students s
          WHERE a.id = $1
            AND a.student_id = s.id
            AND s.teacher_id = $2
          RETURNING
            a.id,
            a.student_id,
            a.attendance_date,
            a.period,
            a.present
          `,
          [
            attendanceId,
            teacherId
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "سجل الحضور غير موجود أو لا تملك صلاحية حذفه."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم حذف سجل الحضور.",
        attendance:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "Delete attendance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف سجل الحضور."
      });
    } finally {
      client.release();
    }
  }
);

module.exports = router;