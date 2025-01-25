const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create members
    await queryInterface.bulkInsert("Members", [
      {
        id: "M1001",
        name: "John Doe",
        email: "john.doe@example.com",
        pfNo: "P-0234",
        jobTitle: "Sample Job Title",
        phone: "+254712345678",
        address: "Hse 60, Arina Estate",
        joinDate: new Date("2024-01-15"),
        status: "Active",
        savingsBalance: 75000,
        loansBalance: 45000,
        lastContribution: new Date("2024-12-30"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "M1002",
        name: "Eddy Odhiambo",
        email: "eddy@example.com",
        pfNo: "P-0234",
        jobTitle: "Sample Job Title",
        phone: "+254712345678",
        address: "Hse 60, Arina Estate",
        joinDate: new Date("2024-01-15"),
        status: "Active",
        savingsBalance: 75000,
        loansBalance: 45000,
        lastContribution: new Date("2024-12-30"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "M1003",
        name: "Jane Doe",
        email: "janedoe@example.com",
        pfNo: "P-0234",
        jobTitle: "Sample Job Title",
        phone: "+254712345678",
        address: "Hse 60, Arina Estate",
        joinDate: new Date("2024-01-15"),
        status: "Active",
        savingsBalance: 75000,
        loansBalance: 45000,
        lastContribution: new Date("2024-12-30"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more members as needed
    ]);

    // Create users
    await queryInterface.bulkInsert("Users", [
      {
        userEmail: "admin@admin.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        memberId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userEmail: "johndoe@example.com",
        password: await bcrypt.hash("member123", 10),
        role: "member",
        memberId: "M1001",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create loans
    await queryInterface.bulkInsert("Loans", [
      {
        id: "L1001",
        memberId: "M1001",
        amount: 50000,
        purpose: "Business Expansion",
        status: "Active",
        dateIssued: new Date("2024-12-15"),
        dueDate: new Date("2025-12-15"),
        applicationDate: new Date("2024-12-01"),
        interestRate: 12,
        remainingBalance: 45000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "L1002",
        memberId: "M1001",
        amount: 30000,
        purpose: "Business Expansion",
        status: "Active",
        dateIssued: new Date("2024-12-15"),
        dueDate: new Date("2025-12-15"),
        applicationDate: new Date("2024-12-01"),
        interestRate: 12,
        remainingBalance: 25000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "L1003",
        memberId: "M1003",
        amount: 30000,
        purpose: "Business Expansion",
        status: "Paid",
        dateIssued: new Date("2024-12-15"),
        dueDate: new Date("2025-12-15"),
        applicationDate: new Date("2024-12-01"),
        interestRate: 12,
        remainingBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "L1004",
        memberId: "M1002",
        amount: 70000,
        purpose: "Business Expansion",
        status: "Active",
        dateIssued: new Date("2024-12-15"),
        dueDate: new Date("2025-12-15"),
        applicationDate: new Date("2024-12-01"),
        interestRate: 12,
        remainingBalance: 55000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create loan repayments
    await queryInterface.bulkInsert("LoanRepayments", [
      {
        repaymentId: "REP001",
        loanId: "L1001",
        date: new Date("2025-01-05"),
        amount: 5000,
        principalPaid: 4500,
        interestPaid: 500,
        balanceAfter: 45000,
        status: "Completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        repaymentId: "REP002",
        loanId: "L1001",
        date: new Date("2025-01-05"),
        amount: 5000,
        principalPaid: 4500,
        interestPaid: 500,
        balanceAfter: 45000,
        status: "Completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        repaymentId: "REP003",
        loanId: "L1001",
        date: new Date("2025-01-05"),
        amount: 5000,
        principalPaid: 4500,
        interestPaid: 500,
        balanceAfter: 45000,
        status: "Completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        repaymentId: "REP004",
        loanId: "L1001",
        date: new Date("2025-01-05"),
        amount: 5000,
        principalPaid: 4500,
        interestPaid: 500,
        balanceAfter: 45000,
        status: "Completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create savings
    await queryInterface.bulkInsert("Savings", [
      {
        memberId: "M1001",
        amount: 5000,
        date: new Date("2025-01-01"),
        type: "Monthly Contribution",
        status: "Completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        memberId: "M1002",
        amount: 5000,
        date: new Date("2025-01-01"),
        type: "Monthly Contribution",
        status: "Completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        memberId: "M1003",
        amount: 5000,
        date: new Date("2025-01-01"),
        type: "Monthly Contribution",
        status: "Completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create savings history
    await queryInterface.bulkInsert("SavingsHistories", [
      {
        memberId: "M1001",
        currentSavingsBalance: 75000,
        accountStatus: "Active",
        monthlySavingsAmt: 100,
        dateJoined: new Date("2024-01-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        memberId: "M1002",
        currentSavingsBalance: 75000,
        accountStatus: "Active",
        monthlySavingsAmt: 100,
        dateJoined: new Date("2024-01-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        memberId: "M1003",
        currentSavingsBalance: 75000,
        accountStatus: "Active",
        monthlySavingsAmt: 100,
        dateJoined: new Date("2024-01-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create savings transactions
    await queryInterface.bulkInsert("SavingsTransactions", [
      {
        transactionNo: "TRX001",
        memberId: "M1001",
        transactionDate: new Date("2025-01-01"),
        transactionType: "Deposit",
        amount: 5000,
        balanceAfter: 75000,
        notes: "Monthly contribution",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        transactionNo: "TRX002",
        memberId: "M1002",
        transactionDate: new Date("2025-01-01"),
        transactionType: "Deposit",
        amount: 5000,
        balanceAfter: 80000,
        notes: "Monthly contribution",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        transactionNo: "TRX003",
        memberId: "M1003",
        transactionDate: new Date("2025-01-01"),
        transactionType: "Deposit",
        amount: 5000,
        balanceAfter: 85000,
        notes: "Monthly contribution",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all seeded data in reverse order
    await queryInterface.bulkDelete("SavingsTransactions", null, {});
    await queryInterface.bulkDelete("SavingsHistories", null, {});
    await queryInterface.bulkDelete("Savings", null, {});
    await queryInterface.bulkDelete("LoanRepayments", null, {});
    await queryInterface.bulkDelete("Loans", null, {});
    await queryInterface.bulkDelete("Users", null, {});
    await queryInterface.bulkDelete("Members", null, {});
  },
};
