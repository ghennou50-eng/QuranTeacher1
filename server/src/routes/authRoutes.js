const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../database");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "secret_key";


// =====================================================
// 0. تسجيل دخول مدير النظام
// =====================================================

router.post(
  "/admin/login",
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى إدخال البريد الإلكتروني وكلمة المرور."
        });
      }

      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();

      const userResult =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE LOWER(TRIM(email)) =
                LOWER(TRIM($1))
            AND role = 'admin'
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (
        userResult.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "بيانات دخول الإدارة غير صحيحة."
        });
      }

      const user =
        userResult.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message:
            "حساب الإدارة معطل حاليًا."
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message:
            "بيانات دخول الإدارة غير صحيحة."
        });
      }

      const token =
        jwt.sign(
          {
            id: user.id,
            userId: user.id,
            role: "admin"
          },
          JWT_SECRET,
          {
            expiresIn: "7d"
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "تم تسجيل دخول الإدارة بنجاح.",
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error(
        "Admin Login Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "خطأ في الخادم أثناء تسجيل دخول الإدارة.",
        error:
          error.message
      });
    }
  }
);


// =====================================================
// 1. تسجيل دخول المدرسة
// =====================================================

router.post(
  "/school/login",
  async (req, res) => {
    try {
      const {
        phone,
        password
      } = req.body;

      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى إدخال رقم الهاتف وكلمة المرور."
        });
      }

      const userResult =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE email = $1
            AND role = 'school'
          LIMIT 1
          `,
          [phone.trim()]
        );

      if (
        userResult.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "بيانات الدخول غير صحيحة."
        });
      }

      const user =
        userResult.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message:
            "حساب المدرسة غير مفعل حاليًا."
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message:
            "بيانات الدخول غير صحيحة."
        });
      }

      const schoolResult =
        await pool.query(
          `
          SELECT *
          FROM schools
          WHERE user_id = $1
          LIMIT 1
          `,
          [user.id]
        );

      const schoolData =
        schoolResult.rows.length > 0
          ? schoolResult.rows[0]
          : {
              id: user.id,
              user_id: user.id
            };

      const token =
        jwt.sign(
          {
            id: user.id,
            userId: user.id,
            schoolId:
              schoolData.id,
            role: "school"
          },
          JWT_SECRET,
          {
            expiresIn: "7d"
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "تم تسجيل الدخول بنجاح.",
        token,
        school:
          schoolData
      });

    } catch (error) {
      console.error(
        "School Login Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "خطأ في الخادم أثناء تسجيل دخول المدرسة.",
        error:
          error.message
      });
    }
  }
);


// =====================================================
// 2. تسجيل دخول المعلم
// =====================================================

router.post(
  "/teacher/login",
  async (req, res) => {
    try {
      const {
        teacherCode,
        password
      } = req.body;

      if (!teacherCode || !password) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى إدخال معرف المعلم وكلمة المرور."
        });
      }

      const cleanCode =
        String(
          teacherCode
        ).trim();

      const result =
        await pool.query(
          `
          SELECT
            u.id AS user_id,
            u.email,
            u.password_hash,
            u.role,
            u.is_active,

            t.id AS teacher_id,
            t.school_id,
            t.teacher_code,
            t.full_name,
            t.phone

          FROM users u

          INNER JOIN teachers t
            ON t.user_id = u.id

          WHERE
            t.teacher_code = $1
            AND u.role = 'teacher'

          LIMIT 1
          `,
          [cleanCode]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "معرف المعلم أو كلمة المرور غير صحيحة."
        });
      }

      const teacher =
        result.rows[0];

      if (!teacher.is_active) {
        return res.status(403).json({
          success: false,
          message:
            "حساب المعلم معطل حاليًا."
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          teacher.password_hash
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message:
            "معرف المعلم أو كلمة المرور غير صحيحة."
        });
      }

      const token =
        jwt.sign(
          {
            id:
              teacher.user_id,

            userId:
              teacher.user_id,

            teacherId:
              teacher.teacher_id,

            schoolId:
              teacher.school_id,

            role:
              "teacher"
          },
          JWT_SECRET,
          {
            expiresIn: "7d"
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "تم تسجيل الدخول بنجاح.",

        token,

        teacher: {
          id:
            teacher.teacher_id,

          userId:
            teacher.user_id,

          teacherCode:
            teacher.teacher_code,

          fullName:
            teacher.full_name,

          phone:
            teacher.phone,

          schoolId:
            teacher.school_id
        }
      });

    } catch (error) {
      console.error(
        "Teacher Login Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "خطأ في الخادم أثناء تسجيل دخول المعلم.",
        error:
          error.message
      });
    }
  }
);


// =====================================================
// 3. تسجيل دخول ولي الأمر
// =====================================================

router.post(
  "/parent/login",
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى إدخال البريد الإلكتروني وكلمة المرور."
        });
      }

      const cleanEmail =
        String(
          email
        )
          .trim()
          .toLowerCase();

      const userResult =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE LOWER(TRIM(email)) =
                LOWER(TRIM($1))
            AND role = 'parent'
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (
        userResult.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "حساب ولي الأمر غير موجود."
        });
      }

      const user =
        userResult.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message:
            "حساب ولي الأمر معطل حاليًا."
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message:
            "كلمة المرور غير صحيحة."
        });
      }

      let parentResult =
        await pool.query(
          `
          SELECT *
          FROM parents
          WHERE user_id = $1
          LIMIT 1
          `,
          [user.id]
        );

      let parentData =
        parentResult.rows[0];

      if (!parentData) {
        const newParent =
          await pool.query(
            `
            INSERT INTO parents
              (user_id, full_name)
            VALUES
              ($1, $2)
            RETURNING *
            `,
            [
              user.id,
              user.email
            ]
          );

        parentData =
          newParent.rows[0];
      }

      const token =
        jwt.sign(
          {
            id:
              user.id,

            userId:
              user.id,

            parentId:
              parentData.id,

            role:
              "parent"
          },
          JWT_SECRET,
          {
            expiresIn: "7d"
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "تم تسجيل الدخول بنجاح.",

        token,

        user: {
          id:
            user.id,

          email:
            user.email,

          role:
            user.role
        },

        parent:
          parentData
      });

    } catch (error) {
      console.error(
        "Parent Login Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "خطأ في الخادم أثناء تسجيل دخول ولي الأمر.",
        error:
          error.message
      });
    }
  }
);


// =====================================================
// 4. إنشاء حساب ولي أمر جديد
// =====================================================

router.post(
  "/parent/register",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        email,
        password
      } = req.body;

      const fullName =
        req.body.fullName ||
        req.body.full_name ||
        "ولي أمر";

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى توفير البريد الإلكتروني وكلمة المرور."
        });
      }

      const cleanEmail =
        String(
          email
        )
          .trim()
          .toLowerCase();

      await client.query(
        "BEGIN"
      );

      const existingUser =
        await client.query(
          `
          SELECT id
          FROM users
          WHERE LOWER(TRIM(email)) =
                LOWER(TRIM($1))
          LIMIT 1
          `,
          [cleanEmail]
        );

      if (
        existingUser.rows.length > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "البريد الإلكتروني مُسجل بالفعل."
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const userResult =
        await client.query(
          `
          INSERT INTO users
            (
              email,
              password_hash,
              role,
              is_active
            )
          VALUES
            (
              $1,
              $2,
              'parent',
              true
            )
          RETURNING id
          `,
          [
            cleanEmail,
            hashedPassword
          ]
        );

      const userId =
        userResult.rows[0].id;

      const parentResult =
        await client.query(
          `
          INSERT INTO parents
            (
              user_id,
              full_name
            )
          VALUES
            (
              $1,
              $2
            )
          RETURNING id
          `,
          [
            userId,
            fullName
          ]
        );

      const parentId =
        parentResult.rows[0].id;

      await client.query(
        "COMMIT"
      );

      const token =
        jwt.sign(
          {
            id:
              userId,

            userId:
              userId,

            parentId:
              parentId,

            role:
              "parent"
          },
          JWT_SECRET,
          {
            expiresIn:
              "7d"
          }
        );

      return res.status(201).json({
        success: true,
        message:
          "تم إنشاء حساب ولي الأمر بنجاح.",

        token,

        user: {
          id:
            userId,

          parentId:
            parentId,

          email:
            cleanEmail,

          fullName:
            fullName,

          role:
            "parent"
        }
      });

    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Parent Register Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إنشاء الحساب.",
        error:
          error.message
      });

    } finally {
      client.release();
    }
  }
);


module.exports = router;

