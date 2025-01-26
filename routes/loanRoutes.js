const express = require("express");
const router = express.Router();
const { loanController, upload } = require("../controllers/loanController");
const { auth, authorize } = require("../middleware/auth");
const path = require("path");

// Add route to serve document files
router.get("/documents/:id/:documentType", loanController.getDocument);

router.use(auth); // Protect all loan routes

// Admin only routes
router.post(
  "/",
  authorize("admin", "superadmin", "member"),
  upload.fields([
    { name: "employmentContract", maxCount: 1 },
    { name: "bankStatements", maxCount: 1 },
    { name: "idDocument", maxCount: 1 },
  ]),
  loanController.createLoan
);

router.post(
  "/upload-documents",
  authorize("admin", "superadmin", "member"),
  upload.fields([
    { name: "employmentContract", maxCount: 1 },
    { name: "bankStatements", maxCount: 1 },
    { name: "idDocument", maxCount: 1 },
  ]),
  loanController.uploadDocuments
);

router.put(
  "/:id/approve",
  authorize("admin", "superadmin"),
  loanController.approveLoan
);

router.post(
  "/repayment",
  authorize("admin", "superadmin"),
  loanController.recordRepayment
);
router.post(
  "/group-repayment",
  authorize("admin", "superadmin"),
  loanController.recordGroupRepayment
);



// Routes accessible by all authenticated users
router.get("/", loanController.getAllLoans);
router.get("/:id", loanController.getLoan);
router.get("/member/:memberId", loanController.getMemberLoans);

module.exports = router;
