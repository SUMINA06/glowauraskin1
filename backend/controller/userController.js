const { User } = require("../model/User");
const { generateToken } = require("../config/jwt");

const createUser = async (req, res) => {
  try {
    const { username, email, password, phone, address } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    const hashedPassword = await User.hashPassword(password);

    const userData = {
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      role: "user",
    };

    const result = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: result[0].insertId,
    });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.code === "ER_DUP_ENTRY") {
      let message = "Email or username already exists";
      if (error.message.includes("username")) {
        message = "Username already exists";
      } else if (error.message.includes("email")) {
        message = "Email already exists";
      }
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const { username, email, password, phone, address } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    const hashedPassword = await User.hashPassword(password);

    const userData = {
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      role: "admin",
      is_admin: true,
    };

    const [existingByEmail] = await User.findByEmail(email);
    const [existingByUsername] = await User.findByUsername(username);

    if ((existingByEmail && existingByEmail.length > 0) || (existingByUsername && existingByUsername.length > 0)) {
      console.log("Admin user already exists");
      return res.status(200).json({
        success: true,
        message: "Admin user already exists",
      });
    }

    const result = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      userId: result[0].insertId,
    });
  } catch (error) {
    console.error("Error creating admin user:", error.message || error);

    if (error.code === "ER_DUP_ENTRY") {
      if (error.message.includes("email")) {
        console.log("Admin user already exists");
        return res.status(200).json({
          success: true,
          message: "Admin user already exists",
        });
      }
      if (error.message.includes("username")) {
        console.warn("Admin username already exists");
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating admin user",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(id);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findByEmail(email);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const users = await User.findByEmail(email);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    const isPasswordValid = await User.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const activeRole = (user.is_admin || user.role === "admin") ? "admin" : "user";
    const token = generateToken(user.id, user.email, user.username, activeRole);

    const { password: _pw, ...safeUser } = user;

    if (!safeUser.role) {
      safeUser.role = activeRole;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: safeUser,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error: error.message,
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || "").toString();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier (username or email) and password are required",
      });
    }

    const users = await User.findByEmailOrUsername(identifier);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const user = users[0];

    if (user.role !== "admin" && !user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const isPasswordValid = await User.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = generateToken(user.id, user.email, user.username, "admin");

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: "admin",
      is_admin: user.is_admin,
    };

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      data: safeUser,
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

const verifyAdminToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user[0].role !== "admin" && !user[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const { password: _pw, ...safeUser } = user[0];

    res.status(200).json({
      success: true,
      message: "Token verified",
      data: safeUser,
    });
  } catch (error) {
    console.error("Error verifying admin token:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying token",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(id);
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.update(id, updates);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(id);
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.delete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  createAdminUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  loginUser,
  adminLogin,
  verifyAdminToken,
};