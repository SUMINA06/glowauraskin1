const db = require('./config/db');
const bcrypt = require('bcrypt');

// Seed admin user
const seedAdminUser = async () => {
  try {
    console.log('Starting to seed admin user...');
    
    // Admin credentials
    const adminEmail = 'admin@gmail.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin already exists
    const checkQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
    const [existingUser] = await db.query(checkQuery, [adminEmail, adminUsername]);
    
    if (existingUser.length > 0) {
      console.log('Admin user already exists. Skipping creation.');
      process.exit(0);
    }
    
    // Insert admin user
    const insertQuery = `
      INSERT INTO users (username, email, password, role, is_admin) 
      VALUES (?, ?, ?, 'admin', TRUE)
    `;
    
    await db.query(insertQuery, [adminUsername, adminEmail, hashedPassword]);
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdminUser();
