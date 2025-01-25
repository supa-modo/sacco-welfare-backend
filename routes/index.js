const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const memberRoutes = require("./memberRoutes");
const loanRoutes = require("./loanRoutes");
const savingsRoutes = require("./savingsRoutes");

router.use("/users", userRoutes);
router.use("/members", memberRoutes);
router.use("/loans", loanRoutes);
router.use("/savings", savingsRoutes);

module.exports = router;
