const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Loan = sequelize.define("Loan", {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        return parseFloat(this.getDataValue("amount"));
      },
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending",
    },
    dateIssued: {
      type: DataTypes.DATE,
    },
    dueDate: {
      type: DataTypes.DATE,
    },
    applicationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      get() {
        return parseFloat(this.getDataValue("interestRate"));
      },
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        return parseFloat(this.getDataValue("remainingBalance"));
      },
    },
    employmentContract: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankStatements: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idDocument: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loanTerm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
  });

  Loan.associate = (models) => {
    Loan.belongsTo(models.Member, {
      foreignKey: "memberId",
      as: "member",
    });
    Loan.hasMany(models.LoanRepayment, {
      foreignKey: "loanId",
      as: "repayments",
    });
  };

  return Loan;
};
