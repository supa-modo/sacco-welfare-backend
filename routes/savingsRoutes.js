const express = require("express");
const router = express.Router();
const savingsController = require("../controllers/savingsController");
const { auth, authorize } = require("../middleware/auth");

router.use(auth); // Protect all savings routes

// Admin only routes
router.post(
  "/deposit",
  authorize(["admin", "superadmin"]),
  savingsController.recordDeposit
);
router.post(
  "/group-deposit",
  authorize(["admin", "superadmin"]),
  savingsController.recordGroupDeposit
);
router.post(
  "/withdraw",
  authorize(["admin", "superadmin"]),
  savingsController.processWithdrawal
);

// Routes accessible by all authenticated users
router.get("/", savingsController.getAllSavings);
router.get("/stats", savingsController.getSavingsStats);
router.get("/member/:memberId", savingsController.getMemberSavings);

module.exports = router;
