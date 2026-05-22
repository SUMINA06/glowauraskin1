const db = require("../config/db");
const bcrypt = require("bcrypt");

const userTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  role ENUM('user', 'admin') DEFAULT 'user'
)`;

const createUserTable = async () => {
  try {
    await db.query(userTableQuery);
    console.log("Users table created or already exists");
  } catch (err) {
    console.error("Error creating users table:", err);
  }
};

const User = {
  create: async (userData) => {
    const query = "INSERT INTO users SET ?";
    return await db.query(query, [userData]);
  },

  findById: async (id) => {
    const query = "SELECT * FROM users WHERE id = ?";
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  findByEmail: async (email) => {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.query(query, [email]);
    return rows;
  },

  findByUsername: async (username) => {
    const query = "SELECT * FROM users WHERE username = ?";
    const [rows] = await db.query(query, [username]);
    return rows;
  },

  findByEmailOrUsername: async (identifier) => {
    const query = "SELECT * FROM users WHERE email = ? OR username = ?";
    const [rows] = await db.query(query, [identifier, identifier]);
    return rows;
  },

  findAll: async () => {
    const query = "SELECT * FROM users";
    const [rows] = await db.query(query);
    return rows;
  },

  update: async (id, userData) => {
    const query = "UPDATE users SET ? WHERE id = ?";
    return await db.query(query, [userData, id]);
  },

  delete: async (id) => {
    const query = "DELETE FROM users WHERE id = ?";
    return await db.query(query, [id]);
  },

  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },
};

const ensureDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminUsername || !adminPassword) {
      return;
    }

    const [existingUserRows] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [adminEmail, adminUsername],
    );

    if (existingUserRows.length > 0) {
      console.log('Default admin account already exists');
      return;
    }

    const hashedPassword = await User.hashPassword(adminPassword);
    await db.query(
      'INSERT INTO users (username, email, password, role, is_admin) VALUES (?, ?, ?, ?, ?)',
      [adminUsername, adminEmail, hashedPassword, 'admin', true],
    );

    console.log('Default admin account created:', adminEmail);
  } catch (error) {
    console.error('Error creating default admin account:', error);
  }
};

module.exports = { User, createUserTable, ensureDefaultAdmin };