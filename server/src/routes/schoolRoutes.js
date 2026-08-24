const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pool = require("../database");

const router = express.Router();

const uploadsDirectory = path.join(
  __dirname,
  "../../uploads"
);

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDirectory);
  },

  filename: (req, file, cb) => {
    const extension =
      path.extname(
        file.originalname
      ).toLowerCase();

    const safeName = `${Date.now()}-${Math.round(
      Math.random() * 1000000000
    )}${extension}`;

    cb(null, safeName);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "يسمح فقط بصور JPG وPNG وWebP."
        )
      );
    }

    cb(null, true);
  }
});

const schoolImagesUpload = upload.fields([
  {
    name: "insideImage",
    maxCount: 1
  },
  {
    name: "outsideImage",
    maxCount: 1
  }
]);

/*
  إرسال طلب تسجيل مدرسة
*/
router.post(
  "/register",
  schoolImagesUpload,
  async (req, res) => {
    try {
      const {
        associationName,
        clubName,
        phone,
        wilaya,
        municipality,
        neighborhood,
        password
      } = req.body;

      if (
        !associationName ||
        !clubName ||
        !phone ||
        !wilaya ||
        !municipality ||
        !neighborhood ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى ملء جميع البيانات المطلوبة."
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
        });
      }

      if (
        !req.files ||
        !req.files.insideImage ||
        !req.files.outsideImage
      ) {
        return res.status(400).json({
          success: false,
          message:
            "يجب إضافة الصورة الداخلية والخارجية للمدرسة."
        });
      }

      const existingRequest =
        await pool.query(
          `
          SELECT id
          FROM school_requests
          WHERE phone = $1
            AND status = 'pending'
          LIMIT 1
          `,
          [phone]
        );

      if (
        existingRequest.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "يوجد بالفعل طلب تسجيل قيد المراجعة لهذا الرقم."
        });
      }

      const existingSchool =
        await pool.query(
          `
          SELECT id
          FROM schools
          WHERE phone = $1
          LIMIT 1
          `,
          [phone]
        );

      if (
        existingSchool.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "هذا الرقم مرتبط بمدرسة مسجلة بالفعل."
        });
      }

      const insideImage =
        req.files.insideImage[0];

      const outsideImage =
        req.files.outsideImage[0];

      const insideImageUrl =
        `/uploads/${insideImage.filename}`;

      const outsideImageUrl =
        `/uploads/${outsideImage.filename}`;

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await pool.query(
          `
          INSERT INTO school_requests (
            association_name,
            club_name,
            phone,
            wilaya,
            municipality,
            district,
            inside_image_url,
            outside_image_url,
            password_hash,
            status
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
            'pending'
          )
          RETURNING
            id,
            association_name,
            club_name,
            phone,
            wilaya,
            municipality,
            district,
            inside_image_url,
            outside_image_url,
            status,
            created_at
          `,
          [
            associationName,
            clubName,
            phone,
            wilaya,
            municipality,
            neighborhood,
            insideImageUrl,
            outsideImageUrl,
            passwordHash
          ]
        );

      return res.status(201).json({
        success: true,
        message:
          "تم إرسال طلب تسجيل المدرسة بنجاح.",
        request:
          result.rows[0]
      });

    } catch (error) {
      console.error(
        "School registration error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء إرسال طلب تسجيل المدرسة."
      });
    }
  }
);

/*
  جلب طلبات المدارس
*/
router.get(
  "/requests",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            id,
            association_name,
            club_name,
            phone,
            wilaya,
            municipality,
            district,
            inside_image_url,
            outside_image_url,
            status,
            created_at,
            reviewed_at,
            rejection_reason
          FROM school_requests
          ORDER BY created_at DESC
          `
        );

      return res.status(200).json({
        success: true,
        requests:
          result.rows
      });

    } catch (error) {
      console.error(
        "Get school requests error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر جلب طلبات المدارس."
      });
    }
  }
);

/*
  جلب طلب واحد
*/
router.get(
  "/requests/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT
            id,
            association_name,
            club_name,
            phone,
            wilaya,
            municipality,
            district,
            inside_image_url,
            outside_image_url,
            status,
            created_at,
            reviewed_at,
            rejection_reason
          FROM school_requests
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "طلب المدرسة غير موجود."
        });
      }

      return res.status(200).json({
        success: true,
        request:
          result.rows[0]
      });

    } catch (error) {
      console.error(
        "Get school request error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر جلب طلب المدرسة."
      });
    }
  }
);

/*
  الموافقة على مدرسة
*/
router.post(
  "/requests/:id/approve",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const { id } =
        req.params;

      await client.query(
        "BEGIN"
      );

      const requestResult =
        await client.query(
          `
          SELECT *
          FROM school_requests
          WHERE id = $1
          FOR UPDATE
          `,
          [id]
        );

      if (
        requestResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "طلب المدرسة غير موجود."
        });
      }

      const request =
        requestResult.rows[0];

      if (
        request.status !==
        "pending"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "تمت معالجة هذا الطلب مسبقًا."
        });
      }

      const existingSchool =
        await client.query(
          `
          SELECT id
          FROM schools
          WHERE phone = $1
          LIMIT 1
          `,
          [request.phone]
        );

      if (
        existingSchool.rows.length > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "المدرسة مرتبطة بحساب موجود بالفعل."
        });
      }

      const userResult =
        await client.query(
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

      const userId =
        userResult.rows[0].id;

      const schoolResult =
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
          RETURNING *
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
          reviewed_at =
            CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [id]
      );

      await client.query(
        "COMMIT"
      );

      return res.status(200).json({
        success: true,
        message:
          "تمت الموافقة على المدرسة وإنشاء حسابها.",
        school:
          schoolResult.rows[0]
      });

    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Approve school error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء الموافقة على المدرسة."
      });

    } finally {
      client.release();
    }
  }
);

/*
  رفض مدرسة
*/
router.post(
  "/requests/:id/reject",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { reason } =
        req.body;

      const result =
        await pool.query(
          `
          UPDATE school_requests
          SET
            status = 'rejected',
            reviewed_at =
              CURRENT_TIMESTAMP,
            rejection_reason = $2
          WHERE id = $1
            AND status = 'pending'
          RETURNING
            id,
            association_name,
            status,
            reviewed_at,
            rejection_reason
          `,
          [
            id,
            reason || null
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "الطلب غير موجود أو تمت معالجته مسبقًا."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم رفض طلب المدرسة.",
        request:
          result.rows[0]
      });

    } catch (error) {
      console.error(
        "Reject school error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "حدث خطأ أثناء رفض الطلب."
      });
    }
  }
);

/*
  جلب المدارس المسجلة
*/
router.get(
  "/",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            s.id,
            s.user_id,
            s.association_name,
            s.club_name,
            s.phone,
            s.wilaya,
            s.municipality,
            s.district,
            s.inside_image_url,
            s.outside_image_url,
            u.is_active,
            s.created_at
          FROM schools s
          LEFT JOIN users u
            ON u.id = s.user_id
          ORDER BY s.created_at DESC
          `
        );

      return res.status(200).json({
        success: true,
        schools:
          result.rows
      });

    } catch (error) {
      console.error(
        "Get schools error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر جلب المدارس."
      });
    }
  }
);

/*
  تعديل معلومات المدرسة
*/
router.patch(
  "/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        associationName,
        clubName,
        phone,
        wilaya,
        municipality,
        district
      } = req.body;

      if (
        !associationName ||
        !clubName ||
        !phone ||
        !wilaya ||
        !municipality ||
        !district
      ) {
        return res.status(400).json({
          success: false,
          message:
            "يرجى ملء جميع معلومات المدرسة."
        });
      }

      const schoolResult =
        await pool.query(
          `
          SELECT
            id,
            user_id
          FROM schools
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );

      if (
        schoolResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "المدرسة غير موجودة."
        });
      }

      const school =
        schoolResult.rows[0];

      const existingPhone =
        await pool.query(
          `
          SELECT id
          FROM schools
          WHERE phone = $1
            AND id <> $2
          LIMIT 1
          `,
          [
            phone.trim(),
            id
          ]
        );

      if (
        existingPhone.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "رقم الهاتف مرتبط بمدرسة أخرى."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE schools
          SET
            association_name = $1,
            club_name = $2,
            phone = $3,
            wilaya = $4,
            municipality = $5,
            district = $6
          WHERE id = $7
          RETURNING
            id,
            user_id,
            association_name AS "associationName",
            club_name AS "clubName",
            phone,
            wilaya,
            municipality,
            district,
            inside_image_url AS "insideImageUrl",
            outside_image_url AS "outsideImageUrl",
            created_at AS "createdAt"
          `,
          [
            associationName.trim(),
            clubName.trim(),
            phone.trim(),
            wilaya.trim(),
            municipality.trim(),
            district.trim(),
            id
          ]
        );

      /*
        تحديث رقم الهاتف في حساب المدرسة
        لأن رقم الهاتف هو بيانات الدخول.
      */
      if (school.user_id) {
        await pool.query(
          `
          UPDATE users
          SET email = $1
          WHERE id = $2
            AND role = 'school'
          `,
          [
            phone.trim(),
            school.user_id
          ]
        );
      }

      return res.status(200).json({
        success: true,
        message:
          "تم تحديث معلومات المدرسة بنجاح.",
        school:
          result.rows[0]
      });

    } catch (error) {
      console.error(
        "Update school information error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر تحديث معلومات المدرسة."
      });
    }
  }
);

/*
  تغيير حالة المدرسة
*/
router.patch(
  "/:id/status",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { isActive } =
        req.body;

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "حالة المدرسة غير صحيحة."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE users u
          SET is_active = $1
          FROM schools s
          WHERE s.id = $2
            AND u.id = s.user_id
          RETURNING
            s.id,
            u.is_active
          `,
          [
            isActive,
            id
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "المدرسة غير موجودة."
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "تم تحديث حالة المدرسة.",
        school:
          result.rows[0]
      });

    } catch (error) {
      console.error(
        "Update school status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر تحديث حالة المدرسة."
      });
    }
  }
);

/*
  حذف المدرسة نهائيًا
*/
router.delete(
  "/:id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const { id } =
        req.params;

      await client.query(
        "BEGIN"
      );

      const schoolResult =
        await client.query(
          `
          SELECT
            id,
            user_id,
            inside_image_url,
            outside_image_url
          FROM schools
          WHERE id = $1
          FOR UPDATE
          `,
          [id]
        );

      if (
        schoolResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "المدرسة غير موجودة."
        });
      }

      const school =
        schoolResult.rows[0];

      await client.query(
        `
        DELETE FROM schools
        WHERE id = $1
        `,
        [id]
      );

      if (school.user_id) {
        await client.query(
          `
          DELETE FROM users
          WHERE id = $1
          `,
          [school.user_id]
        );
      }

      await client.query(
        "COMMIT"
      );

      const deleteImageFile = (
        imageUrl
      ) => {
        if (!imageUrl) {
          return;
        }

        const filename =
          path.basename(
            imageUrl
          );

        const imagePath =
          path.join(
            uploadsDirectory,
            filename
          );

        if (
          fs.existsSync(
            imagePath
          )
        ) {
          try {
            fs.unlinkSync(
              imagePath
            );
          } catch (fileError) {
            console.error(
              "Delete school image failed:",
              fileError
            );
          }
        }
      };

      deleteImageFile(
        school.inside_image_url
      );

      deleteImageFile(
        school.outside_image_url
      );

      return res.status(200).json({
        success: true,
        message:
          "تم حذف المدرسة وحسابها نهائيًا."
      });

    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Delete school error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "تعذر حذف المدرسة. قد تكون هناك بيانات مرتبطة بها."
      });

    } finally {
      client.release();
    }
  }
);

/*
  التعامل مع أخطاء رفع الملفات
*/
router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "حجم الصورة يجب ألا يتجاوز 5 ميغابايت."
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "حدث خطأ أثناء رفع الصور."
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "الملف المرفوع غير صالح."
      });
    }

    next();
  }
);

module.exports = router;
