const {
  Saving,
  Member,
  SavingsHistory,
  SavingsTransaction,
  sequelize,
} = require("../models");

const savingsController = {
  // Get all savings transactions
  getAllSavings: async (req, res) => {
    try {
      const savings = await SavingsHistory.findAll({
        include: [
          {
            model: Member,
            as: "member",
            attributes: ["name", "email"],
          },
        ],
      });
      res.json(savings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get member's savings history
  getMemberSavings: async (req, res) => {
    try {
      const savingsHistory = await SavingsHistory.findOne({
        where: { memberId: req.params.memberId },
        include: [
          {
            model: SavingsTransaction,
            as: "transactions",
          },
        ],
      });

      if (!savingsHistory) {
        return res.status(404).json({ error: "Savings history not found" });
      }

      res.json(savingsHistory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Record new savings deposit
  recordDeposit: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { memberId, amount, type } = req.body;

      // Verify member exists and is active
      const member = await Member.findByPk(memberId);
      if (!member || member.status !== "Active") {
        throw new Error("Invalid or inactive member");
      }

      // Create savings record
      const saving = await Saving.create(
        {
          memberId,
          amount,
          type,
          date: new Date(),
          status: "Completed",
        },
        { transaction: t }
      );

      // Update member's savings balance
      const newBalance = parseFloat(member.savingsBalance) + parseFloat(amount);
      await member.update(
        {
          savingsBalance: newBalance,
          lastContribution: new Date(),
        },
        { transaction: t }
      );

      // Record transaction in savings history
      let savingsHistory = await SavingsHistory.findOne({
        where: { memberId },
      });

      if (!savingsHistory) {
        savingsHistory = await SavingsHistory.create(
          {
            memberId,
            currentSavingsBalance: newBalance,
            dateJoined: member.joinDate,
          },
          { transaction: t }
        );
      } else {
        await savingsHistory.update(
          {
            currentSavingsBalance: newBalance,
          },
          { transaction: t }
        );
      }

      // Create transaction record
      await SavingsTransaction.create(
        {
          memberId,
          transactionNo: `TRX${Date.now()}`,
          transactionDate: new Date(),
          transactionType: "Deposit",
          amount,
          balanceAfter: newBalance,
          notes: `${type} deposit`,
        },
        { transaction: t }
      );

      await t.commit();
      res.status(201).json(saving);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Process withdrawal request
  processWithdrawal: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { memberId, amount, notes } = req.body;

      const member = await Member.findByPk(memberId);
      if (!member) {
        throw new Error("Member not found");
      }

      if (parseFloat(amount) > parseFloat(member.savingsBalance)) {
        throw new Error("Insufficient balance");
      }

      const newBalance = parseFloat(member.savingsBalance) - parseFloat(amount);

      // Update member's balance
      await member.update({ savingsBalance: newBalance }, { transaction: t });

      // Update savings history
      await SavingsHistory.update(
        { currentSavingsBalance: newBalance },
        {
          where: { memberId },
          transaction: t,
        }
      );

      // Record withdrawal transaction
      const transaction = await SavingsTransaction.create(
        {
          memberId,
          transactionNo: `TRX${Date.now()}`,
          transactionDate: new Date(),
          transactionType: "Withdrawal",
          amount: -amount,
          balanceAfter: newBalance,
          notes,
        },
        { transaction: t }
      );

      await t.commit();
      res.status(201).json(transaction);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Get savings statistics
  getSavingsStats: async (req, res) => {
    try {
      const totalSavings = await Member.sum("savingsBalance");
      const activeMembers = await Member.count({
        where: { status: "Active" },
      });
      const monthlyContributions = await Saving.sum("amount", {
        where: {
          type: "Monthly Contribution",
          status: "Completed",
          date: {
            [sequelize.Op.gte]: new Date(new Date().setDate(1)), // First day of current month
          },
        },
      });

      res.json({
        totalSavings,
        activeMembers,
        monthlyContributions,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Record group monthly contribution
  recordGroupDeposit: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { amount, date, month, year, notes } = req.body;

      // Get all active members
      const activeMembers = await Member.findAll({
        where: { status: "Active" },
        include: [
          {
            model: SavingsHistory,
            as: "savingsHistory",
          },
        ],
      });

      const results = [];

      // Process savings for each active member
      for (const member of activeMembers) {
        const contributionAmount =
          member.savingsHistory?.monthlySavingsAmt || amount;

        // Create savings record
        const saving = await Saving.create(
          {
            memberId: member.id,
            amount: contributionAmount,
            type: "Monthly Contribution",
            date: new Date(date),
            status: "Completed",
          },
          { transaction: t }
        );

        // Update member's savings balance
        const newBalance =
          parseFloat(member.savingsBalance) + parseFloat(contributionAmount);
        await member.update(
          {
            savingsBalance: newBalance,
            lastContribution: new Date(date),
          },
          { transaction: t }
        );

        // Update savings history
        let savingsHistory = await SavingsHistory.findOne({
          where: { memberId: member.id },
        });

        if (savingsHistory) {
          await savingsHistory.update(
            {
              currentSavingsBalance: newBalance,
            },
            { transaction: t }
          );
        }

        // Create transaction record
        await SavingsTransaction.create(
          {
            memberId: member.id,
            transactionNo: `TRX${Date.now()}-${member.id}`,
            transactionDate: new Date(date),
            transactionType: "Deposit",
            amount: contributionAmount,
            balanceAfter: newBalance,
            notes: `Monthly Contribution for ${month} ${year}`,
          },
          { transaction: t }
        );

        results.push(saving);
      }

      await t.commit();
      res.status(201).json(results);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = savingsController;
