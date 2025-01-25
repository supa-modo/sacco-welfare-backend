module.exports = (sequelize, DataTypes) => {
  const SavingsHistory = sequelize.define("SavingsHistory", {
    memberId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    currentSavingsBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    monthlySavingsAmt: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    accountStatus: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
    },
    dateJoined: DataTypes.DATE,
  });

  SavingsHistory.associate = (models) => {
    SavingsHistory.belongsTo(models.Member, {
      foreignKey: "memberId",
      as: "member",
    });
    SavingsHistory.hasMany(models.SavingsTransaction, {
      foreignKey: "memberId",
      as: "transactions",
    });
  };

  return SavingsHistory;
};
