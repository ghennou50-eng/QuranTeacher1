const express = require("express");

const pool = require("../database");
const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
  التأكد من أن الطالب تابع للمعلم الحالي
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
      s.teacher_id,
      s.first_name,
      s.last_name,
      s.username
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
  GET /api/progress/:studentId

  يجلب الحفظ والملاحظات الخاصة بالطالب.
*/
router.get(
  "/:studentId",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const studentId =
        req.params.studentId;

      const student =
        await verifyTeacherStudent(
          client,
          teacherId,
          studentId
        );

      if (!student) {
        return res.status(403).json({
          success: false,
          message:
            "لا تملك صلاحية الوصول إلى هذا الطالب."
        });
      }

      const memorizationResult =
        await client.query(
          `
          SELECT
            id,
            student_id,
            memorization_date,
            surah,
            from_ayah,
            to_ayah,
            amount,
            notes,
            created_at
          FROM memorization
          WHERE student_id = $1
          ORDER BY
            memorization_date DESC,
            id DESC
          `,
          [studentId]
        );

      const notesResult =
        await client.query(
          `
          SELECT
            n.id,
            n.student_id,
            n.teacher_id,
            n.note,
            n.created_at,
            t.full_name AS teacher_name
          FROM teacher_notes n
          INNER JOIN teachers t
            ON t.id = n.teacher_id
          WHERE n.student_id = $1
            AND n.teacher_id = $2
          ORDER BY
            n.created_at DESC
          `,
          [
            studentId,
            teacherId
          ]
        );

      return res.status(200).json({
        success: true,
        student,
        memorization:
          memorizationResult.rows,
        notes:
          notesResult.rows
      });
    } catch (error) {
      console.error(
        "Get student progress error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر جلب متابعة الطالب."
      });
    } finally {
      client.release();
    }
  }
);

/*
  POST /api/progress/:studentId/memorization

  تسجيل حفظ جديد.
*/
router.post(
  "/:studentId/memorization",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const studentId =
        req.params.studentId;

      const {
        memorizationDate,
        surah,
        fromAyah,
        toAyah,
        amount,
        notes
      } = req.body;

      if (!memorizationDate) {
        return res.status(400).json({
          success: false,
          message:
            "يجب تحديد تاريخ الحفظ."
        });
      }

      if (!surah && !amount) {
        return res.status(400).json({
          success: false,
          message:
            "يجب إدخال السورة أو مقدار الحفظ."
        });
      }

      const student =
        await verifyTeacherStudent(
          client,
          teacherId,
          studentId
        );

      if (!student) {
        return res.status(403).json({
          success: false,
          message:
            "لا تملك صلاحية تسجيل حفظ هذا الطالب."
        });
      }

      const result =
        await client.query(
          `
          INSERT INTO memorization (
            student_id,
            memorization_date,
            surah,
            from_ayah,
            to_ayah,
            amount,
            notes
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
          RETURNING
            id,
            student_id,
            memorization_date,
            surah,
            from_ayah,
            to_ayah,
            amount,
            notes,
            created_at
          `,
          [
            studentId,
            memorizationDate,
            surah
              ? String(surah).trim()
              : null,
            fromAyah !== undefined &&
            fromAyah !== ""
              ? Number(fromAyah)
              : null,
            toAyah !== undefined &&
            toAyah !== ""
              ? Number(toAyah)
              : null,
            amount
              ? String(amount).trim()
              : null,
            notes
              ? String(notes).trim()
              : null
          ]
        );

      return res.status(201).json({
        success: true,
        message:
          "تم تسجيل الحفظ بنجاح.",
        memorization:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "Create memorization error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تسجيل الحفظ."
      });
    } finally {
      client.release();
    }
  }
);

/*
  DELETE /api/progress/memorization/:id

  حذف سجل حفظ للمعلم الحالي.
*/
router.delete(
  "/memorization/:id",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const memorizationId =
        req.params.id;

      const result =
        await client.query(
          `
          DELETE FROM memorization m
          USING students s
          WHERE m.id = $1
            AND m.student_id = s.id
            AND s.teacher_id = $2
          RETURNING
            m.id,
            m.student_id
          `,
          [
            memorizationId,
            teacherId
          ]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "سجل الحفظ غير موجود أو لا تملك صلاحية حذفه."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم حذف سجل الحفظ."
      });
    } catch (error) {
      console.error(
        "Delete memorization error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف سجل الحفظ."
      });
    } finally {
      client.release();
    }
  }
);

/*
  POST /api/progress/:studentId/notes

  إضافة ملاحظة للطالب.
*/
router.post(
  "/:studentId/notes",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const studentId =
        req.params.studentId;

      const {
        note
      } = req.body;

      if (
        !note ||
        !String(note).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "يجب كتابة الملاحظة."
        });
      }

      const student =
        await verifyTeacherStudent(
          client,
          teacherId,
          studentId
        );

      if (!student) {
        return res.status(403).json({
          success: false,
          message:
            "لا تملك صلاحية إضافة ملاحظة لهذا الطالب."
        });
      }

      const result =
        await client.query(
          `
          INSERT INTO teacher_notes (
            student_id,
            teacher_id,
            note
          )
          VALUES (
            $1,
            $2,
            $3
          )
          RETURNING
            id,
            student_id,
            teacher_id,
            note,
            created_at
          `,
          [
            studentId,
            teacherId,
            String(note).trim()
          ]
        );

      return res.status(201).json({
        success: true,
        message:
          "تمت إضافة الملاحظة.",
        note:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "Create teacher note error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إضافة الملاحظة."
      });
    } finally {
      client.release();
    }
  }
);

/*
  DELETE /api/progress/notes/:id

  حذف ملاحظة للمعلم الحالي.
*/
router.delete(
  "/notes/:id",
  requireAuth,
  requireRole("teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId =
        req.user.teacherId;

      const noteId =
        req.params.id;

      const result =
        await client.query(
          `
          DELETE FROM teacher_notes
          WHERE id = $1
            AND teacher_id = $2
          RETURNING
            id,
            student_id
          `,
          [
            noteId,
            teacherId
          ]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "الملاحظة غير موجودة أو لا تملك صلاحية حذفها."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم حذف الملاحظة."
      });
    } catch (error) {
      console.error(
        "Delete teacher note error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف الملاحظة."
      });
    } finally {
      client.release();
    }
  }
);

module.exports = router;