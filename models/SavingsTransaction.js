module.exports = (sequelize, DataTypes) => {
  const SavingsTransaction = sequelize.define("SavingsTransaction", {
    transactionNo: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionDate: DataTypes.DATE,
    transactionType: {
      type: DataTypes.ENUM("Deposit", "Withdrawal"),
      allowNull: false,
    },
    amount: DataTypes.DECIMAL(10, 2),
    balanceAfter: DataTypes.DECIMAL(10, 2),
    notes: DataTypes.STRING,
  });

  SavingsTransaction.associate = (models) => {
    SavingsTransaction.belongsTo(models.SavingsHistory, {
      foreignKey: "memberId",
      as: "savingsHistory",
    });
  };

  return SavingsTransaction;
};
