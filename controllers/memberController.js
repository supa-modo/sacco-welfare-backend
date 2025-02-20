const {
  Member,
  User,
  Loan,
  Saving,
  SavingsHistory,
  SavingsTransaction,
} = require("../models");
const sequelize = require("../models").sequelize;

const memberController = {
  // Get all members
  getAllMembers: async (req, res) => {
    try {
      const members = await Member.findAll({
        include: [
          {
            model: Loan,
            as: "loans",
            attributes: ["id", "amount", "status"],
          },
          {
            model: Saving,
            as: "savings",
            attributes: ["id", "amount", "date"],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get single member
  getMember: async (req, res) => {
    try {
      const member = await Member.findByPk(req.params.id, {
        include: [
          {
            model: Loan,
            as: "loans",
            order: [["updatedAt", "DESC"]],
          },
          {
            model: Saving,
            as: "savings",
            order: [["date", "DESC"]],
          },
          {
            model: SavingsHistory,
            as: "savingsHistory",
            order: [["updatedAt", "DESC"]],
          },
        ],
        order: [
          ["updatedAt", "DESC"],
          [{ model: Loan, as: "loans" }, "updatedAt", "DESC"],
          [{ model: Saving, as: "savings" }, "date", "DESC"],
          [
            { model: SavingsHistory, as: "savingsHistory" },
            "updatedAt",
            "DESC",
          ],
        ],
      });

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json(member);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new member
  createMember: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const memberData = req.body;
      const INITIAL_DEPOSIT = 1000; // Default initial deposit amount

      // Create member
      const member = await Member.create(
        {
          ...memberData,
          savingsBalance: INITIAL_DEPOSIT, // Set initial savings balance
        },
        { transaction: t }
      );

      // Create savings history record
      await SavingsHistory.create(
        {
          memberId: member.id,
          currentSavingsBalance: INITIAL_DEPOSIT,
          monthlySavingsAmt: memberData.monthlySavingsAmt,
          accountStatus: "Active",
          dateJoined: member.joinDate,
        },
        { transaction: t }
      );

      // Create initial savings deposit record
      await Saving.create(
        {
          memberId: member.id,
          amount: INITIAL_DEPOSIT,
          type: "Monthly Contribution",
          date: new Date(),
          status: "Completed",
        },
        { transaction: t }
      );

      // Create savings transaction record
      await SavingsTransaction.create(
        {
          memberId: member.id,
          transactionNo: `TRX${Date.now().toString()}-${member.id}`,
          transactionDate: new Date(),
          transactionType: "Deposit",
          amount: INITIAL_DEPOSIT,
          balanceAfter: INITIAL_DEPOSIT,
          notes: "Initial membership deposit",
        },
        { transaction: t }
      );

      await t.commit();
      res.status(201).json(member);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Update member
  updateMember: async (req, res) => {
    try {
      const [updated] = await Member.update(req.body, {
        where: { id: req.params.id },
      });

      if (!updated) {
        return res.status(404).json({ error: "Member update unsuccessful" });
      }

      const updatedMember = await Member.findByPk(req.params.id);
      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete member
  deleteMember: async (req, res) => {
    try {
      const deleted = await Member.destroy({
        where: { id: req.params.id },
      });

      if (!deleted) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json({ message: "Member deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = memberController;
