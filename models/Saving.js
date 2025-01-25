module.exports = (sequelize, DataTypes) => {
  const Saving = sequelize.define("Saving", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: DataTypes.DATE,
    type: {
      type: DataTypes.ENUM("Monthly Contribution", "Emergency Fund"),
      defaultValue: "Monthly Contribution",
    },
    status: {
      type: DataTypes.ENUM("Completed", "Pending", "Failed"),
      defaultValue: "Pending",
    },
  });

  Saving.associate = (models) => {
    Saving.belongsTo(models.Member, {
      foreignKey: "memberId",
      as: "member",
    });
  };

  return Saving;
};
