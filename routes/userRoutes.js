const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, authorize } = require("../middleware/auth");

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);

// Protected routes
router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, userController.updateProfile);
router.post("/logout", auth, userController.logout);

// Admin routes
router.get(
  "/",
  auth,
  authorize(["admin", "superadmin"]),
  userController.getAllUsers
);
router.post(
  "/:id/reset-password",
  auth,
  authorize(["admin", "superadmin"]),
  userController.resetPassword
);
router.put(
  "/:id/email",
  auth,
  authorize(["admin", "superadmin"]),
  userController.updateEmail
);

router.get("/check-member/:memberId", userController.checkMember);
router.delete(
  "/:id",
  auth,
  authorize(["admin", "superadmin"]),
  userController.deleteUser
);

module.exports = router;
