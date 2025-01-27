const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Member } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const userController = {
  // Check member ID and get details
  checkMember: async (req, res) => {
    try {
      const { memberId } = req.params;
      const member = await Member.findByPk(memberId);

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Check if user already exists for this member
      const existingUser = await User.findOne({ where: { memberId } });
      if (existingUser) {
        return res.status(400).json({ error: "Member already has an account" });
      }

      res.json({
        email: member.email,
        name: member.name,
        status: member.status,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Register new user
  register: async (req, res) => {
    try {
      const { userEmail, password, memberId } = req.body;

      if (!userEmail || !password || !memberId) {
        return res.status(400).json({
          error: "Email, password, and member ID are required",
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ where: { userEmail } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Verify member exists
      const member = await Member.findByPk(memberId);
      if (!member) {
        return res.status(400).json({ error: "Invalid member ID" });
      }

      // Verify member email matches
      if (member.email !== userEmail) {
        return res.status(400).json({
          error: "Email does not match member records",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        userEmail,
        password: hashedPassword,
        role: "member",
        memberId,
      });

      const { password: _, ...userWithoutPassword } = user.toJSON();
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "An error occurred during registration",
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { userEmail, password } = req.body;

      // Find user
      const user = await User.findOne({
        where: { userEmail },
        include: [
          {
            model: Member,
            as: "member",
            attributes: ["name", "status"],
          },
        ],
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "24h",
      });

      const { password: _, ...userWithoutPassword } = user.toJSON();
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all users (admin only)
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Member,
            as: "member",
            attributes: ["name", "status"],
          },
        ],
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Member,
            as: "member",
            attributes: ["name", "status", "savingsBalance", "loansBalance"],
          },
        ],
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { password, ...updateData } = req.body;

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await User.update(updateData, {
        where: { id: req.user.id },
      });

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Reset user password (admin only)
  resetPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update user email (admin only)
  updateEmail: async (req, res) => {
    try {
      const { id } = req.params;
      const { newEmail } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if email is already in use
      const existingUser = await User.findOne({
        where: { userEmail: newEmail },
      });
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ error: "Email already in use" });
      }

      await user.update({ userEmail: newEmail });
      res.json({ message: "Email updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await user.destroy();
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Logout (optional - can be handled client-side)
  logout: async (req, res) => {
    try {
      // You could implement token blacklisting here if needed
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = userController;
