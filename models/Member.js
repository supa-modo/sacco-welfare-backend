module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define("Member", {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    pfNo: DataTypes.STRING,
    jobTitle: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    joinDate: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
    },
    savingsBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    loansBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    lastContribution: DataTypes.DATE,
  });

  Member.associate = (models) => {
    Member.hasOne(models.User, {
      foreignKey: "memberId",
      as: "user",
    });
    Member.hasMany(models.Loan, {
      foreignKey: "memberId",
      as: "loans",
    });
    Member.hasMany(models.Saving, {
      foreignKey: "memberId",
      as: "savings",
    });
    Member.hasOne(models.SavingsHistory, {
      foreignKey: "memberId",
      as: "savingsHistory",
    });
  };

  return Member;
};
