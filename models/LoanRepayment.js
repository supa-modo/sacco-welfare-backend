module.exports = (sequelize, DataTypes) => {
  const LoanRepayment = sequelize.define("LoanRepayment", {
    repaymentId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: DataTypes.DATE,
    amount: DataTypes.DECIMAL(10, 2),
    principalPaid: DataTypes.DECIMAL(10, 2),
    interestPaid: DataTypes.DECIMAL(10, 2),
    balanceAfter: DataTypes.DECIMAL(10, 2),
    status: {
      type: DataTypes.ENUM("Completed", "Pending", "Failed"),
      defaultValue: "Pending",
    },
  });

  LoanRepayment.associate = (models) => {
    LoanRepayment.belongsTo(models.Loan, {
      foreignKey: "loanId",
      as: "loan",
    });
  };

  return LoanRepayment;
};
