const jwt = require("jsonwebtoken");


// =====================================================
// التحقق من تسجيل الدخول
// =====================================================

function requireAuth(req, res, next) {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message:
          "غير مصرح. يرجى تسجيل الدخول."
      });
    }

    const parts =
      authorization.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "رمز الدخول غير صحيح."
      });
    }

    const token = parts[1];

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    /*
      مهم جدًا:

      التوكن الذي أنشأناه يحتوي على:
      userId

      بينما بقية ملفات المشروع تستخدم:
      req.user.id

      لذلك نوحدهما هنا حتى تعمل
      جميع الـ routes بدون تغييرها.
    */

    req.user = {
      ...decoded,

      id:
        decoded.userId
    };

    next();

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "جلسة الدخول غير صالحة أو منتهية."
    });
  }
}


// =====================================================
// التحقق من صلاحية المستخدم
// =====================================================

function requireRole(...allowedRoles) {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "غير مصرح."
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "ليس لديك صلاحية للقيام بهذا الإجراء."
      });
    }

    next();
  };
}


module.exports = {
  requireAuth,
  requireRole
};