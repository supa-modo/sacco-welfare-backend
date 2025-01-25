const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const { auth, authorize } = require("../middleware/auth");

// router.use(auth); // Protect all member routes

// Admin only routes
router.post(
  "/",
  // authorize("admin", "superadmin"),
  memberController.createMember
);
router.put(
  "/:id",
  // authorize("admin", "superadmin"),
  memberController.updateMember
);
router.delete(
  "/:id",
  // authorize("admin", "superadmin"),
  memberController.deleteMember
);

// Routes accessible by all authenticated users
router.get("/", memberController.getAllMembers);
router.get("/:id", memberController.getMember);

module.exports = router;
