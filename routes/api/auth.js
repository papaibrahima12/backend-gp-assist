const router = require("express").Router();
const { login, getAuthenticatedUser, register } = require("../../app/controllers/api/authcontroller");
const { loginValidation, authAdmin,registerValidation } = require("../../app/middleware/auth");

router.post("/register", registerValidation, register);

// router.get("/verify/:token", verify);

router.post("/login", loginValidation, login);

// router.post("/verify/resend", resendVerification);

// router.get("/", authAdmin, getAuthenticatedUser);

router.get("/users", authAdmin, getAuthenticatedUser);






module.exports = router;