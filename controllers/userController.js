const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Member } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { userEmail, password, role, memberId } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { userEmail } });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // If memberId provided, verify member exists
      if (memberId) {
        const member = await Member.findByPk(memberId);
        if (!member) {
          return res.status(400).json({ error: "Invalid member ID" });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username,
        password: hashedPassword,
        role,
        memberId,
      });

      const { password: _, ...userWithoutPassword } = user.toJSON();
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
