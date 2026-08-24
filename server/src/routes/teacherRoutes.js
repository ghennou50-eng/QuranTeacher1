const express = require("express");
const bcrypt = require("bcryptjs");

const pool = require("../database");
const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

function generateTeacherCode() {
  const randomPart = Math.floor(
    100000 + Math.random() * 900000
  );

  return `TCH-${randomPart}`;
}

async function generateUniqueTeacherCode(client) {
  let code;
  let exists = true;

  while (exists) {
    code = generateTeacherCode();

    const result = await client.query(
      `
      SELECT id
      FROM teachers
      WHERE teacher_code = $1
      LIMIT 1
      `,
      [code]
    );

    exists = result.rows.length > 0;
  }

  return code;
}

/*
  جلب معلمي المدرسة
*/
router.get(
  "/",
  requireAuth,
  requireRole("school"),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      const result = await pool.query(
        `
        SELECT
          t.id,
          t.teacher_code,
          t.full_name,
          t.phone,
          t.created_at,
          u.is_active
        FROM teachers t
        INNER JOIN users u
          ON u.id = t.user_id
        WHERE t.school_id = $1
        ORDER BY t.created_at DESC
        `,
        [schoolId]
      );

      return res.status(200).json({
        success: true,
        teachers: result.rows
      });
    } catch (error) {
      console.error(
        "Get teachers error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "تعذر جلب معلمي المدرسة."
      });
    }
  }
);

/*
  إضافة معلم
*/
router.post(
  "/",
  requireAuth,
  requireRole("school"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        fullName,
        phone,
        password
      } = req.body;

      const schoolId = req.user.schoolId;

      if (!fullName || !password) {
        return res.status(400).json({
          success: false,
          message:
            "الاسم وكلمة المرور مطلوبان."
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
        });
      }

      await client.query("BEGIN");

      const teacherCode =
        await generateUniqueTeacherCode(client);

      const passwordHash =
        await bcrypt.hash(password, 12);

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
          'teacher',
          TRUE
        )
        RETURNING id
        `,
        [
          teacherCode,
          passwordHash
        ]
      );

      const userId = userResult.rows[0].id;

      const teacherResult = await client.query(
        `
        INSERT INTO teachers (
          user_id,
          school_id,
          teacher_code,
          full_name,
          phone
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          id,
          teacher_code,
          full_name,
          phone,
          created_at
        `,
        [
          userId,
          schoolId,
          teacherCode,
          fullName.trim(),
          phone
            ? phone.trim()
            : null
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message:
          "تم إنشاء حساب المعلم بنجاح.",
        teacher: teacherResult.rows[0]
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Create teacher error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إنشاء حساب المعلم."
      });
    } finally {
      client.release();
    }
  }
);

/*
  تعديل بيانات المعلم
*/
router.put(
  "/:id",
  requireAuth,
  requireRole("school"),
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      const schoolId = req.user.schoolId;

      const {
        fullName,
        phone
      } = req.body;

      if (!fullName) {
        return res.status(400).json({
          success: false,
          message:
            "اسم المعلم مطلوب."
        });
      }

      const result = await pool.query(
        `
        UPDATE teachers
        SET
          full_name = $1,
          phone = $2
        WHERE id = $3
          AND school_id = $4
        RETURNING
          id,
          teacher_code,
          full_name,
          phone
        `,
        [
          fullName.trim(),
          phone
            ? phone.trim()
            : null,
          teacherId,
          schoolId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "المعلم غير موجود في هذه المدرسة."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم تعديل بيانات المعلم.",
        teacher: result.rows[0]
      });
    } catch (error) {
      console.error(
        "Update teacher error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تعديل بيانات المعلم."
      });
    }
  }
);

/*
  تغيير كلمة مرور المعلم
*/
router.patch(
  "/:id/password",
  requireAuth,
  requireRole("school"),
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      const schoolId = req.user.schoolId;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "كلمة المرور مطلوبة."
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
        });
      }

      const passwordHash =
        await bcrypt.hash(password, 12);

      const result = await pool.query(
        `
        UPDATE users u
        SET password_hash = $1
        FROM teachers t
        WHERE t.user_id = u.id
          AND t.id = $2
          AND t.school_id = $3
        RETURNING
          t.id,
          t.teacher_code,
          t.full_name
        `,
        [
          passwordHash,
          teacherId,
          schoolId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "المعلم غير موجود في هذه المدرسة."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم تغيير كلمة مرور المعلم.",
        teacher: result.rows[0]
      });
    } catch (error) {
      console.error(
        "Change teacher password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تغيير كلمة المرور."
      });
    }
  }
);

/*
  تفعيل / تعطيل حساب المعلم
*/
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("school"),
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      const schoolId = req.user.schoolId;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "حالة الحساب غير صالحة."
        });
      }

      const result = await pool.query(
        `
        UPDATE users u
        SET is_active = $1
        FROM teachers t
        WHERE t.user_id = u.id
          AND t.id = $2
          AND t.school_id = $3
        RETURNING
          t.id,
          t.teacher_code,
          t.full_name,
          u.is_active
        `,
        [
          isActive,
          teacherId,
          schoolId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "المعلم غير موجود في هذه المدرسة."
        });
      }

      return res.status(200).json({
        success: true,
        message: isActive
          ? "تم تفعيل حساب المعلم."
          : "تم تعطيل حساب المعلم.",
        teacher: result.rows[0]
      });
    } catch (error) {
      console.error(
        "Change teacher status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر تغيير حالة حساب المعلم."
      });
    }
  }
);

/*
  حذف المعلم
  الطلاب المرتبطون به سيصبح teacher_id لديهم
  فارغًا بسبب ON DELETE SET NULL.
*/
router.delete(
  "/:id",
  requireAuth,
  requireRole("school"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const teacherId = req.params.id;
      const schoolId = req.user.schoolId;

      await client.query("BEGIN");

      const teacherResult =
        await client.query(
          `
          SELECT
            t.id,
            t.user_id,
            t.teacher_code,
            t.full_name
          FROM teachers t
          WHERE t.id = $1
            AND t.school_id = $2
          FOR UPDATE
          `,
          [
            teacherId,
            schoolId
          ]
        );

      if (teacherResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message:
            "المعلم غير موجود في هذه المدرسة."
        });
      }

      const teacher =
        teacherResult.rows[0];

      await client.query(
        `
        DELETE FROM users
        WHERE id = $1
        `,
        [teacher.user_id]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message:
          "تم حذف حساب المعلم.",
        teacher
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Delete teacher error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف حساب المعلم."
      });
    } finally {
      client.release();
    }
  }
);

module.exports = router;