const express = require("express");
const pool = require("../database");
const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// حماية جميع مسارات ولي الأمر
// =====================================================

router.use(requireAuth);
router.use(requireRole("parent"));


// =====================================================
// الحصول على parent_id
// =====================================================

const getParentId = async (user) => {

  // إذا كان موجودًا داخل التوكن
  if (user.parentId) {
    return user.parentId;
  }

  const userId = user.id || user.userId;

  const result = await pool.query(
    `
    SELECT id
    FROM parents
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error(
      "لم يتم العثور على بيانات ولي الأمر."
    );
  }

  return result.rows[0].id;
};


// =====================================================
// التأكد أن الطالب ابن لولي الأمر
// =====================================================

const verifyParentChild = async (
  user,
  studentId
) => {

  const parentId =
    await getParentId(user);

  const result = await pool.query(
    `
    SELECT
      s.id,
      s.school_id,
      s.teacher_id,
      s.username,
      s.first_name,
      s.last_name,
      s.birth_date,
      s.birth_place,
      s.residence,
      s.guardian_name,
      s.guardian_phone

    FROM parent_children pc

    INNER JOIN students s
      ON s.id = pc.student_id

    WHERE
      pc.parent_id = $1
      AND s.id = $2

    LIMIT 1
    `,
    [
      parentId,
      studentId
    ]
  );

  return result.rows[0] || null;
};


// =====================================================
// إضافة ابن
// POST /api/parent/children
// =====================================================

router.post(
  "/children",
  async (req, res) => {

    try {

      const username =
        String(
          req.body.username || ""
        ).trim();

      if (!username) {

        return res.status(400).json({
          success: false,
          message:
            "يرجى إدخال اسم المستخدم الخاص بالطالب."
        });
      }

      const parentId =
        await getParentId(req.user);


      // البحث عن الطالب
      const studentResult =
        await pool.query(
          `
          SELECT
            id,
            first_name,
            last_name,
            username

          FROM students

          WHERE
            LOWER(TRIM(username))
            =
            LOWER(TRIM($1))

          LIMIT 1
          `,
          [username]
        );


      if (
        studentResult.rows.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "لم يتم العثور على طالب باسم المستخدم المدخل."
        });
      }


      const student =
        studentResult.rows[0];


      // =================================================
      // التحقق من وجود العلاقة مسبقًا
      //
      // مهم:
      // parent_children لا نفترض وجود id فيه.
      // نستخدم student_id الموجود فعليًا.
      // =================================================

      const relationResult =
        await pool.query(
          `
          SELECT
            student_id

          FROM parent_children

          WHERE
            parent_id = $1
            AND student_id = $2

          LIMIT 1
          `,
          [
            parentId,
            student.id
          ]
        );


      if (
        relationResult.rows.length > 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "هذا الطالب مضاف بالفعل إلى قائمة أبنائك."
        });
      }


      // =================================================
      // إنشاء العلاقة
      // =================================================

      await pool.query(
        `
        INSERT INTO parent_children
          (
            parent_id,
            student_id
          )

        VALUES
          (
            $1,
            $2
          )
        `,
        [
          parentId,
          student.id
        ]
      );


      return res.status(201).json({

        success: true,

        message:
          "تمت إضافة الابن بنجاح.",

        student: {
          id:
            student.id,

          first_name:
            student.first_name,

          last_name:
            student.last_name,

          username:
            student.username
        }

      });

    } catch (error) {

      console.error(
        "POST /api/parent/children ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "حدث خطأ أثناء إضافة الطالب.",

        error:
          error.message,

        code:
          error.code || null

      });
    }
  }
);


// =====================================================
// جلب أبناء ولي الأمر
// GET /api/parent/children
// =====================================================

router.get(
  "/children",
  async (req, res) => {

    try {

      const parentId =
        await getParentId(req.user);


      const result =
        await pool.query(
          `
          SELECT

            s.id,

            s.username,

            s.first_name,

            s.last_name,

            s.birth_date,

            s.birth_place,

            s.residence,

            s.teacher_id,

            t.teacher_code,

            t.full_name AS teacher_name

          FROM parent_children pc

          INNER JOIN students s
            ON s.id = pc.student_id

          LEFT JOIN teachers t
            ON t.id = s.teacher_id

          WHERE
            pc.parent_id = $1

          ORDER BY
            s.first_name ASC,
            s.last_name ASC
          `,
          [parentId]
        );


      return res.status(200).json({

        success: true,

        children:
          result.rows

      });

    } catch (error) {

      console.error(
        "GET /api/parent/children ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "حدث خطأ أثناء جلب قائمة الأبناء.",

        error:
          error.message,

        code:
          error.code || null

      });
    }
  }
);


// =====================================================
// بيانات طالب محدد
// GET /api/parent/children/:studentId
// =====================================================

router.get(
  "/children/:studentId",
  async (req, res) => {

    try {

      const studentId =
        Number(
          req.params.studentId
        );


      if (
        !Number.isInteger(studentId)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "معرف الطالب غير صحيح."

        });
      }


      const student =
        await verifyParentChild(
          req.user,
          studentId
        );


      if (!student) {

        return res.status(404).json({

          success: false,

          message:
            "الطالب غير موجود أو غير مرتبط بحساب ولي الأمر."

        });
      }


      // جلب معلومات المعلم
      let teacher = null;


      if (student.teacher_id) {

        const teacherResult =
          await pool.query(
            `
            SELECT

              id,

              teacher_code,

              full_name,

              phone

            FROM teachers

            WHERE
              id = $1

            LIMIT 1
            `,
            [
              student.teacher_id
            ]
          );


        teacher =
          teacherResult.rows[0] ||
          null;
      }


      return res.status(200).json({

        success: true,

        student,

        teacher

      });

    } catch (error) {

      console.error(
        "GET /api/parent/children/:studentId ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "حدث خطأ أثناء جلب بيانات الطالب.",

        error:
          error.message

      });
    }
  }
);


// =====================================================
// حضور الطالب
// GET /api/parent/children/:studentId/attendance
// =====================================================

router.get(
  "/children/:studentId/attendance",
  async (req, res) => {

    try {

      const studentId =
        Number(
          req.params.studentId
        );


      if (
        !Number.isInteger(studentId)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "معرف الطالب غير صحيح."

        });
      }


      const student =
        await verifyParentChild(
          req.user,
          studentId
        );


      if (!student) {

        return res.status(403).json({

          success: false,

          message:
            "لا تملك صلاحية الوصول إلى حضور هذا الطالب."

        });
      }


      const result =
        await pool.query(
          `
          SELECT

            id,

            student_id,

            attendance_date,

            period,

            present,

            created_at

          FROM attendance

          WHERE
            student_id = $1

          ORDER BY

            attendance_date DESC,

            id DESC

          LIMIT 100
          `,
          [studentId]
        );


      return res.status(200).json({

        success: true,

        attendance:
          result.rows

      });

    } catch (error) {

      console.error(
        "Parent attendance error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "تعذر جلب حضور الطالب.",

        error:
          error.message

      });
    }
  }
);


// =====================================================
// حفظ الطالب
// GET /api/parent/children/:studentId/memorization
// =====================================================

router.get(
  "/children/:studentId/memorization",
  async (req, res) => {

    try {

      const studentId =
        Number(
          req.params.studentId
        );


      if (
        !Number.isInteger(studentId)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "معرف الطالب غير صحيح."

        });
      }


      const student =
        await verifyParentChild(
          req.user,
          studentId
        );


      if (!student) {

        return res.status(403).json({

          success: false,

          message:
            "لا تملك صلاحية الوصول إلى حفظ هذا الطالب."

        });
      }


      const result =
        await pool.query(
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

          WHERE
            student_id = $1

          ORDER BY

            memorization_date DESC,

            id DESC

          LIMIT 100
          `,
          [studentId]
        );


      return res.status(200).json({

        success: true,

        memorization:
          result.rows

      });

    } catch (error) {

      console.error(
        "Parent memorization error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "تعذر جلب سجل حفظ الطالب.",

        error:
          error.message

      });
    }
  }
);


// =====================================================
// ملاحظات المعلم
// GET /api/parent/children/:studentId/notes
// =====================================================

router.get(
  "/children/:studentId/notes",
  async (req, res) => {

    try {

      const studentId =
        Number(
          req.params.studentId
        );


      if (
        !Number.isInteger(studentId)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "معرف الطالب غير صحيح."

        });
      }


      const student =
        await verifyParentChild(
          req.user,
          studentId
        );


      if (!student) {

        return res.status(403).json({

          success: false,

          message:
            "لا تملك صلاحية الوصول إلى ملاحظات هذا الطالب."

        });
      }


      const result =
        await pool.query(
          `
          SELECT

            n.id,

            n.student_id,

            n.teacher_id,

            n.note,

            n.created_at,

            t.full_name AS teacher_name,

            t.teacher_code

          FROM teacher_notes n

          INNER JOIN teachers t
            ON t.id = n.teacher_id

          WHERE
            n.student_id = $1

          ORDER BY

            n.created_at DESC,

            n.id DESC

          LIMIT 100
          `,
          [studentId]
        );


      return res.status(200).json({

        success: true,

        notes:
          result.rows

      });

    } catch (error) {

      console.error(
        "Parent notes error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "تعذر جلب ملاحظات المعلم.",

        error:
          error.message

      });
    }
  }
);


// =====================================================
// متابعة الطالب كاملة
// GET /api/parent/children/:studentId/dashboard
// =====================================================

router.get(
  "/children/:studentId/dashboard",
  async (req, res) => {

    try {

      const studentId =
        Number(
          req.params.studentId
        );


      if (
        !Number.isInteger(studentId)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "معرف الطالب غير صحيح."

        });
      }


      const student =
        await verifyParentChild(
          req.user,
          studentId
        );


      if (!student) {

        return res.status(403).json({

          success: false,

          message:
            "لا تملك صلاحية الوصول إلى بيانات هذا الطالب."

        });
      }


      // =================================================
      // الحضور
      // =================================================

      const attendanceResult =
        await pool.query(
          `
          SELECT

            id,

            student_id,

            attendance_date,

            period,

            present,

            created_at

          FROM attendance

          WHERE
            student_id = $1

          ORDER BY

            attendance_date DESC,

            id DESC

          LIMIT 30
          `,
          [studentId]
        );


      // =================================================
      // الحفظ
      // =================================================

      const memorizationResult =
        await pool.query(
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

          WHERE
            student_id = $1

          ORDER BY

            memorization_date DESC,

            id DESC

          LIMIT 30
          `,
          [studentId]
        );


      // =================================================
      // ملاحظات المعلم
      // =================================================

      const notesResult =
        await pool.query(
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

          WHERE
            n.student_id = $1

          ORDER BY

            n.created_at DESC,

            n.id DESC

          LIMIT 30
          `,
          [studentId]
        );


      return res.status(200).json({

        success: true,

        student,

        attendance:
          attendanceResult.rows,

        memorization:
          memorizationResult.rows,

        notes:
          notesResult.rows

      });

    } catch (error) {

      console.error(
        "Parent dashboard error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "تعذر جلب متابعة الطالب.",

        error:
          error.message

      });
    }
  }
);


module.exports = router;