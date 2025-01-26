const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
        userEmail: "eddy@example.com",
        password: await bcrypt.hash("member123", 10),
        role: "member",
        memberId: "M778080",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Users", {
      userEmail: {
        [Sequelize.Op.in]: ["admin@admin.com", "eddy@example.com"],
      },
    });
  },
};
