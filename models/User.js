module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userEmail: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "member", "superadmin"),
      defaultValue: "member",
    },
    memberId: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  User.associate = (models) => {
    User.belongsTo(models.Member, {
      foreignKey: "memberId",
      as: "member",
    });
  };

  return User;
};
