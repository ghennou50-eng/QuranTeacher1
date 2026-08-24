const express = require("express");

const pool = require("../database");
const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

function generateStudentUsername() {
  const randomPart = Math.floor(
    100000 + Math.random() * 900000
  );

  return `STU-${randomPart}`;
}

async function generateUniqueStudentUsername(client) {
  let username = "";
  let exists = true;

  while (exists) {
    username = generateStudentUsername();

    const result = await client.query(
      `
      SELECT id
      FROM students
      WHERE username = $1
      LIMIT 1
      `,
      [username]
    );

    exists = result.rows.length > 0;
  }

  return username;
}

async function getCurrentTeacher(client, user) {
  if (user.role !== "teacher") {
    return null;
  }

  const result = await client.query(
    `
    SELECT
      t.id,
      t.school_id,
      t.teacher_code,
      t.full_name,
      u.is_active
    FROM teachers t
    INNER JOIN users u
      ON u.id = t.user_id
    WHERE t.user_id = $1
      AND t.school_id = $2
    LIMIT 1
    `,
    [user.userId, user.schoolId]
  );

  return result.rows[0] || null;
}

async function getSchoolTeacher(
  client,
  teacherId,
  schoolId
) {
  const result = await client.query(
    `
    SELECT
      t.id,
      t.school_id,
      t.teacher_code,
      t.full_name,
      u.is_active
    FROM teachers t
    INNER JOIN users u
      ON u.id = t.user_id
    WHERE t.id = $1
      AND t.school_id = $2
      AND u.is_active = TRUE
    LIMIT 1
    `,
    [teacherId, schoolId]
  );

  return result.rows[0] || null;
}

/*
  GET /api/students

  المدرسة:
  ترى جميع طلابها.

  المعلم:
  يرى الطلاب المسندين إليه فقط.
*/
router.get(
  "/",
  requireAuth,
  requireRole("school", "teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const schoolId = req.user.schoolId;

      let query = `
        SELECT
          s.id,
          s.username,
          s.first_name,
          s.last_name,
          s.birth_date,
          s.birth_place,
          s.residence,
          s.guardian_name,
          s.guardian_phone,
          s.teacher_id,
          t.full_name AS teacher_name,
          s.created_at
        FROM students s
        LEFT JOIN teachers t
          ON t.id = s.teacher_id
        WHERE s.school_id = $1
      `;

      const values = [schoolId];

      if (req.user.role === "teacher") {
        const teacher = await getCurrentTeacher(
          client,
          req.user
        );

        if (!teacher || !teacher.is_active) {
          return res.status(403).json({
            success: false,
            message:
              "حساب المعلم غير موجود أو غير مفعل."
          });
        }

        query += `
          AND s.teacher_id = $2
        `;

        values.push(teacher.id);
      }

      query += `
        ORDER BY s.created_at DESC
      `;

      const result = await client.query(
        query,
        values
      );

      return res.status(200).json({
        success: true,
        students: result.rows
      });
    } catch (error) {
      console.error(
        "Get students error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "تعذر جلب الطلاب."
      });
    } finally {
      client.release();
    }
  }
);

/*
  POST /api/students

  المدرسة:
  يجب أن ترسل teacherId.

  المعلم:
  لا يحتاج teacherId.
  يتم تحديده تلقائيًا من الحساب الذي سجل الدخول.
*/
router.post(
  "/",
  requireAuth,
  requireRole("school", "teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        firstName,
        lastName,
        birthDate,
        birthPlace,
        residence,
        guardianName,
        guardianPhone,
        teacherId
      } = req.body;

      const schoolId = req.user.schoolId;

      if (
        !firstName ||
        !String(firstName).trim() ||
        !lastName ||
        !String(lastName).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى إدخال اسم ولقب الطالب."
        });
      }

      await client.query("BEGIN");

      let assignedTeacher = null;

      if (req.user.role === "teacher") {
        assignedTeacher =
          await getCurrentTeacher(
            client,
            req.user
          );

        if (
          !assignedTeacher ||
          !assignedTeacher.is_active
        ) {
          await client.query("ROLLBACK");

          return res.status(403).json({
            success: false,
            message:
              "تعذر تحديد المعلم الحالي."
          });
        }
      }

      if (req.user.role === "school") {
        if (!teacherId) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            success: false,
            message:
              "يجب تحديد المعلم."
          });
        }

        assignedTeacher =
          await getSchoolTeacher(
            client,
            teacherId,
            schoolId
          );

        if (!assignedTeacher) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            success: false,
            message:
              "المعلم المحدد غير تابع لهذه المدرسة أو أن حسابه معطل."
          });
        }
      }

      const username =
        await generateUniqueStudentUsername(
          client
        );

      const result = await client.query(
        `
        INSERT INTO students (
          school_id,
          teacher_id,
          username,
          first_name,
          last_name,
          birth_date,
          birth_place,
          residence,
          guardian_name,
          guardian_phone
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
          $9,
          $10
        )
        RETURNING
          id,
          username,
          first_name,
          last_name,
          birth_date,
          birth_place,
          residence,
          guardian_name,
          guardian_phone,
          teacher_id,
          created_at
        `,
        [
          schoolId,
          assignedTeacher.id,
          username,
          String(firstName).trim(),
          String(lastName).trim(),
          birthDate || null,
          birthPlace
            ? String(birthPlace).trim()
            : null,
          residence
            ? String(residence).trim()
            : null,
          guardianName
            ? String(guardianName).trim()
            : null,
          guardianPhone
            ? String(guardianPhone).trim()
            : null
        ]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "تم إنشاء الطالب بنجاح.",
        student: result.rows[0]
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }

      console.error(
        "Create student error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إنشاء الطالب."
      });
    } finally {
      client.release();
    }
  }
);

/*
  PUT /api/students/:id

  المدرسة:
  تستطيع تعديل أي طالب في مدرستها.

  المعلم:
  يستطيع تعديل طلابه فقط.
*/
router.put(
  "/:id",
  requireAuth,
  requireRole("school", "teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const studentId = req.params.id;

      const {
        firstName,
        lastName,
        birthDate,
        birthPlace,
        residence,
        guardianName,
        guardianPhone
      } = req.body;

      const schoolId = req.user.schoolId;

      if (
        !firstName ||
        !String(firstName).trim() ||
        !lastName ||
        !String(lastName).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى إدخال اسم ولقب الطالب."
        });
      }

      let query = `
        UPDATE students
        SET
          first_name = $1,
          last_name = $2,
          birth_date = $3,
          birth_place = $4,
          residence = $5,
          guardian_name = $6,
          guardian_phone = $7
        WHERE id = $8
          AND school_id = $9
      `;

      const values = [
        String(firstName).trim(),
        String(lastName).trim(),
        birthDate || null,
        birthPlace
          ? String(birthPlace).trim()
          : null,
        residence
          ? String(residence).trim()
          : null,
        guardianName
          ? String(guardianName).trim()
          : null,
        guardianPhone
          ? String(guardianPhone).trim()
          : null,
        studentId,
        schoolId
      ];

      if (req.user.role === "teacher") {
        const teacher =
          await getCurrentTeacher(
            client,
            req.user
          );

        if (
          !teacher ||
          !teacher.is_active
        ) {
          return res.status(403).json({
            success: false,
            message:
              "حساب المعلم غير موجود أو غير مفعل."
          });
        }

        query += `
          AND teacher_id = $10
        `;

        values.push(teacher.id);
      }

      query += `
        RETURNING
          id,
          username,
          first_name,
          last_name,
          birth_date,
          birth_place,
          residence,
          guardian_name,
          guardian_phone,
          teacher_id
      `;

      const result =
        await client.query(
          query,
          values
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "الطالب غير موجود أو لا تملك صلاحية تعديله."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم تعديل بيانات الطالب.",
        student:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "Update student error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء تعديل الطالب."
      });
    } finally {
      client.release();
    }
  }
);

/*
  DELETE /api/students/:id

  المدرسة:
  تستطيع حذف أي طالب في مدرستها.

  المعلم:
  يستطيع حذف طلابه فقط.
*/
router.delete(
  "/:id",
  requireAuth,
  requireRole("school", "teacher"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const studentId = req.params.id;
      const schoolId = req.user.schoolId;

      let query = `
        DELETE FROM students
        WHERE id = $1
          AND school_id = $2
      `;

      const values = [
        studentId,
        schoolId
      ];

      if (req.user.role === "teacher") {
        const teacher =
          await getCurrentTeacher(
            client,
            req.user
          );

        if (
          !teacher ||
          !teacher.is_active
        ) {
          return res.status(403).json({
            success: false,
            message:
              "حساب المعلم غير موجود أو غير مفعل."
          });
        }

        query += `
          AND teacher_id = $3
        `;

        values.push(teacher.id);
      }

      query += `
        RETURNING
          id,
          username,
          first_name,
          last_name
      `;

      const result =
        await client.query(
          query,
          values
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "الطالب غير موجود أو لا تملك صلاحية حذفه."
        });
      }

      return res.status(200).json({
        success: true,
        message: "تم حذف الطالب.",
        student:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "Delete student error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء حذف الطالب."
      });
    } finally {
      client.release();
    }
  }
);

/*
  PATCH /api/students/:id/teacher

  المدرسة فقط تستطيع تغيير المعلم المسؤول.
*/
router.patch(
  "/:id/teacher",
  requireAuth,
  requireRole("school"),
  async (req, res) => {
    try {
      const studentId = req.params.id;
      const schoolId = req.user.schoolId;
      const { teacherId } = req.body;

      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى تحديد المعلم."
        });
      }

      const teacherResult =
        await pool.query(
          `
          SELECT
            t.id,
            t.full_name
          FROM teachers t
          INNER JOIN users u
            ON u.id = t.user_id
          WHERE t.id = $1
            AND t.school_id = $2
            AND u.is_active = TRUE
          LIMIT 1
          `,
          [
            teacherId,
            schoolId
          ]
        );

      if (
        teacherResult.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "المعلم المحدد غير تابع لهذه المدرسة أو أن حسابه معطل."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE students
          SET teacher_id = $1
          WHERE id = $2
            AND school_id = $3
          RETURNING
            id,
            username,
            first_name,
            last_name,
            teacher_id
          `,
          [
            teacherId,
            studentId,
            schoolId
          ]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "الطالب غير موجود في هذه المدرسة."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم تغيير معلم الطالب.",
        student:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        "Change student teacher error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر تغيير معلم الطالب."
      });
    }
  }
);

module.exports = router;