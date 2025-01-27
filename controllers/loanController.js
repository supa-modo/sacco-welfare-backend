const { Loan, Member, LoanRepayment, sequelize } = require("../models");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Define base upload directory
const UPLOAD_DIR = path.join(__dirname, "../uploads/loan-documents");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

const loanController = {
  // Get all loans
  getAllLoans: async (req, res) => {
    try {
      const loans = await Loan.findAll({
        include: [
          {
            model: Member,
            as: "member",
            attributes: ["id", "name", "email", "phone"],
          },
          {
            model: LoanRepayment,
            as: "repayments",
            order: [["date", "DESC"]], // Sort repayments by date
          },
        ],
        order: [
          ["updatedAt", "DESC"], // Sort loans by latest update
          [{ model: LoanRepayment, as: "repayments" }, "date", "DESC"],
        ],
      });
      res.json(loans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get single loan with repayments
  getLoan: async (req, res) => {
    try {
      const loan = await Loan.findByPk(req.params.id, {
        include: [
          {
            model: Member,
            as: "member",
            attributes: ["id", "name", "email", "phone"],
          },
          {
            model: LoanRepayment,
            as: "repayments",
            order: [["date", "DESC"]], // Sort repayments by date
          },
        ],
        order: [
          ["updatedAt", "DESC"],
          [{ model: LoanRepayment, as: "repayments" }, "date", "DESC"],
        ],
      });

      if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
      }

      // Convert file paths to URLs
      const baseUrl = `${req.protocol}://${req.get("host")}/api/loans`;
      const response = {
        ...loan.toJSON(),
        documents: {
          employmentContract: loan.employmentContract
            ? `${baseUrl}/documents/${loan.id}/employment-contract`
            : null,
          bankStatements: loan.bankStatements
            ? `${baseUrl}/documents/${loan.id}/bank-statements`
            : null,
          idDocument: loan.idDocument
            ? `${baseUrl}/documents/${loan.id}/id-document`
            : null,
        },
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add a new method to serve document files
  getDocument: async (req, res) => {
    try {
      const { id, documentType } = req.params;
      const loan = await Loan.findByPk(id);

      if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
      }

      let filePath;
      switch (documentType) {
        case "employment-contract":
          filePath = loan.employmentContract;
          break;
        case "bank-statements":
          filePath = loan.bankStatements;
          break;
        case "id-document":
          filePath = loan.idDocument;
          break;
        default:
          return res.status(400).json({ error: "Invalid document type" });
      }

      if (!filePath) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Construct absolute path
      const absolutePath = path.join(UPLOAD_DIR, path.basename(filePath));

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.sendFile(absolutePath);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create new loan application
  createLoan: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { memberId, amount, purpose, loanTerm, interestRate } = req.body;
      const files = req.files;

      // Verify member exists and is active
      const member = await Member.findByPk(memberId);
      if (!member || member.status !== "Active") {
        throw new Error("Invalid or inactive member");
      }

      // Validate interest rate
      if (!interestRate || interestRate < 1 || interestRate > 100) {
        throw new Error("Invalid interest rate. Must be between 1% and 100%");
      }

      const applicationDate = new Date();
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + parseInt(loanTerm));

      // Generate loan ID
      const loanId = `L${Date.now().toString()}`;

      // Store file paths (only store the filename, not the full path)
      const documentPaths = {
        employmentContract: files?.employmentContract
          ? path.basename(files.employmentContract[0].path)
          : null,
        bankStatements: files?.bankStatements
          ? path.basename(files.bankStatements[0].path)
          : null,
        idDocument: files?.idDocument
          ? path.basename(files.idDocument[0].path)
          : null,
      };

      // Create loan record with user-provided interest rate
      const loan = await Loan.create(
        {
          id: loanId,
          memberId,
          amount,
          purpose,
          status: "Pending",
          dateIssued: null,
          dueDate,
          applicationDate,
          interestRate,
          loanTerm,
          remainingBalance: amount,
          ...documentPaths,
        },
        { transaction: t }
      );

      // Update member's loans balance
      await member.update(
        {
          loansBalance: parseFloat(member.loansBalance) + parseFloat(amount),
        },
        { transaction: t }
      );

      await t.commit();
      res.status(201).json(loan);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Update loan status (for approvals)
  approveLoan: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const loan = await Loan.findByPk(req.params.id, { transaction: t });

      if (!loan) {
        throw new Error("Loan not found");
      }

      if (loan.status !== "Pending") {
        throw new Error("Can only approve pending loans");
      }

      // Update loan status and set dateIssued
      await loan.update(
        {
          status: "Active",
          dateIssued: new Date(),
        },
        { transaction: t }
      );

      await t.commit();
      res.json({ success: true, message: "Loan approved successfully", loan });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Reject loan application
  rejectLoan: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const loan = await Loan.findByPk(req.params.id, { transaction: t });

      if (!loan) {
        throw new Error("Loan not found");
      }

      if (loan.status !== "Pending") {
        throw new Error("Can only reject pending loans");
      }

      // Update loan status
      await loan.update(
        {
          status: "Rejected",
        },
        { transaction: t }
      );

      await t.commit();
      res.json({ success: true, message: "Loan rejected successfully", loan });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Modify the recordRepayment method to handle accurate interest calculations
  recordRepayment: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { loanId, amount } = req.body;

      const loan = await Loan.findByPk(loanId, { transaction: t });
      if (!loan) {
        throw new Error("Loan not found");
      }

      const currentBalance = parseFloat(loan.remainingBalance);
      const loanAmount = parseFloat(loan.amount);
      const interestRate = parseFloat(loan.interestRate);
      const loanTerm = parseInt(loan.loanTerm);

      // Calculate total amount to be repaid
      const totalInterest = (loanAmount * interestRate * loanTerm) / (12 * 100);
      const totalAmountDue = loanAmount + totalInterest;

      // Calculate standard monthly payment
      const monthlyInterestRate = interestRate / 100 / 12;
      const standardMonthlyPayment =
        (loanAmount *
          monthlyInterestRate *
          Math.pow(1 + monthlyInterestRate, loanTerm)) /
        (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);

      // Validate payment amount
      if (
        parseFloat(amount) >
        currentBalance + currentBalance * monthlyInterestRate
      ) {
        throw new Error(
          "Payment amount cannot exceed remaining balance plus current month's interest"
        );
      }

      // Calculate interest portion based on current balance
      const interestPortion = currentBalance * monthlyInterestRate;

      // If this is the final payment (or close to it), adjust the amount to match exactly
      const isLastPayment = currentBalance <= standardMonthlyPayment;
      const expectedPayment = isLastPayment
        ? currentBalance + interestPortion
        : standardMonthlyPayment;

      // Calculate principal portion
      let principalPortion = parseFloat(amount) - interestPortion;

      // If payment is less than interest due, all goes to interest
      if (principalPortion < 0) {
        principalPortion = 0;
      }

      // Ensure we don't overpay
      const actualPrincipalPaid = Math.min(principalPortion, currentBalance);
      const newBalance = Math.max(0, currentBalance - actualPrincipalPaid);

      // Create repayment record with accurate breakdown
      const repayment = await LoanRepayment.create(
        {
          repaymentId: `REP${Date.now()}`,
          loanId,
          date: new Date(),
          amount: parseFloat(amount),
          principalPaid: actualPrincipalPaid,
          interestPaid: parseFloat(amount) - actualPrincipalPaid,
          balanceAfter: newBalance,
          status: "Completed",
        },
        { transaction: t }
      );

      // Update loan status based on remaining balance
      const newStatus = newBalance <= 0 ? "Paid" : "Active";

      // Update loan remaining balance and status
      await loan.update(
        {
          remainingBalance: newBalance,
          status: newStatus,
        },
        { transaction: t }
      );

      // Update member's loans balance
      const member = await Member.findByPk(loan.memberId, { transaction: t });
      await member.update(
        {
          loansBalance: Math.max(
            0,
            parseFloat(member.loansBalance) - actualPrincipalPaid
          ),
        },
        { transaction: t }
      );

      await t.commit();
      res.status(201).json(repayment);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  recordGroupRepayment: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { date, month, year } = req.body;

      // Get all active loans
      const activeLoans = await Loan.findAll({
        where: {
          status: "Active",
        },
        include: [
          {
            model: Member,
            as: "member",
            where: { status: "Active" },
          },
        ],
        transaction: t,
      });

      const repayments = [];
      for (const loan of activeLoans) {
        // Convert string values to numbers to ensure proper calculation
        const loanAmount = parseFloat(loan.amount);
        const interestRate = parseFloat(loan.interestRate);
        const currentBalance = parseFloat(loan.remainingBalance);
        const loanTerm = parseInt(loan.loanTerm);

        // Calculate total amount to be repaid (principal + total interest)
        const totalInterest =
          (loanAmount * interestRate * loanTerm) / (12 * 100);
        const totalAmountDue = loanAmount + totalInterest;

        // Calculate fixed monthly payment
        const monthlyInterest = interestRate / 100 / 12;
        const fixedMonthlyPayment =
          (loanAmount *
            monthlyInterest *
            Math.pow(1 + monthlyInterest, loanTerm)) /
          (Math.pow(1 + monthlyInterest, loanTerm) - 1);

        // For the last payment, adjust to match total amount exactly
        const isLastPayment = currentBalance <= fixedMonthlyPayment;

        // Calculate interest portion based on current balance
        const interestPortion = currentBalance * monthlyInterest;

        // For regular payments, use the fixed amount
        // For the last payment, calculate the exact amount needed
        const actualPayment = isLastPayment
          ? currentBalance + interestPortion
          : fixedMonthlyPayment;

        // Calculate principal portion
        const principalPortion = actualPayment - interestPortion;

        // Ensure we don't overpay
        const actualPrincipalPaid = Math.min(principalPortion, currentBalance);
        const newBalance = Math.max(0, currentBalance - actualPrincipalPaid);

        // Create repayment record
        const repayment = await LoanRepayment.create(
          {
            repaymentId: `REP${Date.now()}-${loan.id}`,
            loanId: loan.id,
            date: new Date(date),
            amount: actualPayment,
            principalPaid: actualPrincipalPaid,
            interestPaid: interestPortion,
            balanceAfter: newBalance,
            status: "Completed",
          },
          { transaction: t }
        );

        repayments.push(repayment);

        // Update loan status based on remaining balance
        const newStatus = newBalance <= 0 ? "Paid" : "Active";

        // Update loan
        await loan.update(
          {
            remainingBalance: newBalance,
            status: newStatus,
          },
          { transaction: t }
        );

        // Update member's loans balance
        await loan.member.update(
          {
            loansBalance: Math.max(
              0,
              parseFloat(loan.member.loansBalance) - actualPrincipalPaid
            ),
          },
          { transaction: t }
        );
      }

      await t.commit();
      res.status(201).json(repayments);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Get member's loans
  getMemberLoans: async (req, res) => {
    try {
      const loans = await Loan.findAll({
        where: { memberId: req.params.memberId },
        include: [
          {
            model: LoanRepayment,
            as: "repayments",
            order: [["date", "DESC"]], // Sort repayments by date
          },
        ],
        order: [
          ["updatedAt", "DESC"], // Sort loans by latest update
          [{ model: LoanRepayment, as: "repayments" }, "date", "DESC"],
        ],
      });
      res.json(loans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Upload loan documents
  uploadDocuments: async (req, res) => {
    try {
      const files = req.files;
      const paths = Object.values(files).map((file) => file.path);
      res.json({ paths });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get member's monthly loan balances
  getMemberMonthlyLoanBalances: async (req, res) => {
    try {
      const { memberId } = req.params;
      const loans = await Loan.findAll({
        where: {
          memberId,
          status: "Active",
        },
        include: [
          {
            model: LoanRepayment,
            attributes: [
              "date",
              "amount",
              "principalAmount",
              "interestAmount",
              "balanceAfter",
            ],
          },
        ],
        order: [[LoanRepayment, "date", "ASC"]],
      });

      // Get all repayment dates and group by month
      const monthlyBalances = {};

      loans.forEach((loan) => {
        loan.LoanRepayments.forEach((repayment) => {
          const date = new Date(repayment.date);
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!monthlyBalances[monthKey]) {
            monthlyBalances[monthKey] = 0;
          }
          monthlyBalances[monthKey] = repayment.balanceAfter;
        });
      });

      // Convert to array and sort by date
      const balanceHistory = Object.entries(monthlyBalances)
        .map(([month, balance]) => ({
          month,
          loanBalance: balance,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      res.json(balanceHistory);
    } catch (error) {
      console.error("Error getting monthly loan balances:", error);
      res.status(500).json({ error: "Failed to get monthly loan balances" });
    }
  },
};

module.exports = { loanController, upload };
