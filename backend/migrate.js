// Database Migration - Run this to fix the database schema
// This file helps fix the database schema

const db = require("./config/db");

async function migrateDatabase() {
  try {
    

    // Recreate the images table with correct schema
    const imageTableQuery = `
      CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        image_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id)
      )
    `;

    await db.query(imageTableQuery);
    console.log("Images table recreated with correct schema");

    const cartTableQuery = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        quantity INT NOT NULL DEFAULT 1,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_product_id (product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `;

    await db.query(cartTableQuery);
    console.log("Cart items table created or already exists");

    const [userColumnsResult] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('is_admin', 'updated_at', 'role')
    `);

    const existingUserColumns = Array.isArray(userColumnsResult) ? userColumnsResult : [];
    const hasIsAdmin = existingUserColumns.some((column) => column.COLUMN_NAME === 'is_admin');
    const hasUpdatedAt = existingUserColumns.some((column) => column.COLUMN_NAME === 'updated_at');
    const hasRole = existingUserColumns.some((column) => column.COLUMN_NAME === 'role');

    if (!hasIsAdmin) {
      await db.query(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE`);
      console.log("Added is_admin column to users table");
    }

    if (!hasUpdatedAt) {
      await db.query(`ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      console.log("Added updated_at column to users table");
    }

    if (!hasRole) {
      await db.query(`ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'`);
      console.log("Added role column to users table");
    }

    const productColumnCheck = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME IN ('stock', 'is_active')
    `);

    const productColumns = Array.isArray(productColumnCheck)
      ? productColumnCheck[0]
      : productColumnCheck;

    const hasStockColumn = productColumns.some((column) => column.COLUMN_NAME === 'stock');
    const hasActiveColumn = productColumns.some((column) => column.COLUMN_NAME === 'is_active');

    if (!hasStockColumn) {
      await db.query(`ALTER TABLE products ADD COLUMN stock INT NOT NULL DEFAULT 0`);
      console.log("Added stock column to products table");
    }

    if (!hasActiveColumn) {
      await db.query(`ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`);
      console.log("Added is_active column to products table");
    }

    // Ensure foreign keys exist for cart_items and orders
    const [cartForeignKeys] = await db.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'cart_items'
        AND COLUMN_NAME = 'product_id'
        AND REFERENCED_TABLE_NAME = 'products'
    `);

    if (!cartForeignKeys || cartForeignKeys.length === 0) {
      await db.query(`ALTER TABLE cart_items ADD CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`);
      console.log("Added foreign key cart_items.product_id -> products.id");
    }

    const [orderUserForeignKeys] = await db.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'user_id'
        AND REFERENCED_TABLE_NAME = 'users'
    `);

    if (!orderUserForeignKeys || orderUserForeignKeys.length === 0) {
      await db.query(`ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
      console.log("Added foreign key orders.user_id -> users.id");
    }

    // Ensure orders table has the latest schema and columns
    const [orderColumns] = await db.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
    `);

    const existingOrderColumns = orderColumns.map((column) => column.COLUMN_NAME);

    const requiredOrderColumns = [
      {
        name: 'order_number',
        ddl: "VARCHAR(100) NOT NULL UNIQUE",
      },
      {
        name: 'customer_name',
        ddl: "VARCHAR(150) NOT NULL",
      },
      {
        name: 'customer_email',
        ddl: "VARCHAR(150) NOT NULL",
      },
      {
        name: 'customer_phone',
        ddl: "VARCHAR(50) NOT NULL",
      },
      {
        name: 'customer_address',
        ddl: "TEXT NOT NULL",
      },
      {
        name: 'subtotal_amount',
        ddl: "DECIMAL(10, 2) NOT NULL DEFAULT 0",
      },
      {
        name: 'tax_amount',
        ddl: "DECIMAL(10, 2) NOT NULL DEFAULT 0",
      },
      {
        name: 'delivery_charge',
        ddl: "DECIMAL(10, 2) NOT NULL DEFAULT 0",
      },
      {
        name: 'discount_amount',
        ddl: "DECIMAL(10, 2) NOT NULL DEFAULT 0",
      },
      {
        name: 'payment_screenshot',
        ddl: "TEXT NULL",
      },
      {
        name: 'transaction_id',
        ddl: "VARCHAR(255) NULL",
      },
      {
        name: 'payment_gateway_response',
        ddl: "TEXT NULL",
      },
      {
        name: 'payment_method',
        ddl: "ENUM('qr', 'esewa', 'khalti', 'cod') NOT NULL DEFAULT 'qr'",
      },
      {
        name: 'payment_status',
        ddl: "ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending'",
      },
      {
        name: 'order_status',
        ddl: "ENUM('pending','processing','paid','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending'",
      },
    ];

    for (const column of requiredOrderColumns) {
      if (!existingOrderColumns.includes(column.name)) {
        await db.query(`ALTER TABLE orders ADD COLUMN ${column.name} ${column.ddl}`);
        console.log(`Added ${column.name} column to orders table`);
      }
    }

    if (existingOrderColumns.includes('full_name') && !existingOrderColumns.includes('customer_name')) {
      await db.query(`ALTER TABLE orders ADD COLUMN customer_name VARCHAR(150) NOT NULL DEFAULT ''`);
      await db.query(`UPDATE orders SET customer_name = full_name`);
      console.log("Migrated full_name to customer_name");
    }

    if (existingOrderColumns.includes('email') && !existingOrderColumns.includes('customer_email')) {
      await db.query(`ALTER TABLE orders ADD COLUMN customer_email VARCHAR(150) NOT NULL DEFAULT ''`);
      await db.query(`UPDATE orders SET customer_email = email`);
      console.log("Migrated email to customer_email");
    }

    if (existingOrderColumns.includes('phone') && !existingOrderColumns.includes('customer_phone')) {
      await db.query(`ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50) NOT NULL DEFAULT ''`);
      await db.query(`UPDATE orders SET customer_phone = phone`);
      console.log("Migrated phone to customer_phone");
    }

    if (existingOrderColumns.includes('delivery_address') && !existingOrderColumns.includes('customer_address')) {
      await db.query(`ALTER TABLE orders ADD COLUMN customer_address TEXT NOT NULL`);
      await db.query(`UPDATE orders SET customer_address = delivery_address`);
      console.log("Migrated delivery_address to customer_address");
    }

    if (existingOrderColumns.includes('subtotal') && !existingOrderColumns.includes('subtotal_amount')) {
      await db.query(`ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0`);
      await db.query(`UPDATE orders SET subtotal_amount = subtotal`);
      console.log("Migrated subtotal to subtotal_amount");
    }

    if (existingOrderColumns.includes('tax') && !existingOrderColumns.includes('tax_amount')) {
      await db.query(`ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0`);
      await db.query(`UPDATE orders SET tax_amount = tax`);
      console.log("Migrated tax to tax_amount");
    }

    if (existingOrderColumns.includes('shipping') && !existingOrderColumns.includes('delivery_charge')) {
      await db.query(`ALTER TABLE orders ADD COLUMN delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0`);
      await db.query(`UPDATE orders SET delivery_charge = shipping`);
      console.log("Migrated shipping to delivery_charge");
    }

    if (!existingOrderColumns.includes('discount_amount')) {
      await db.query(`ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0`);
      console.log("Added discount_amount column to orders table");
    }

    if (existingOrderColumns.includes('payment_status')) {
      await db.query(`
        ALTER TABLE orders
        MODIFY COLUMN payment_status ENUM('pending', 'completed', 'failed', 'cancelled') NULL DEFAULT 'pending'
      `);
      console.log("Updated payment_status enum values");
    }

    if (existingOrderColumns.includes('order_status')) {
      await db.query(`
        ALTER TABLE orders
        MODIFY COLUMN order_status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') NULL DEFAULT 'pending'
      `);
      console.log("Updated order_status enum values");
    }

    if (existingOrderColumns.includes('payment_method')) {
      await db.query(`
        ALTER TABLE orders 
        MODIFY COLUMN payment_method ENUM('qr', 'esewa', 'khalti', 'cod') NOT NULL DEFAULT 'qr'
      `);
      console.log("Updated payment_method enum to include qr");
    }

    const userIdColumn = orderColumns.find((c) => c.COLUMN_NAME === 'user_id');
    if (userIdColumn && userIdColumn.IS_NULLABLE === 'NO') {
      await db.query(`ALTER TABLE orders MODIFY COLUMN user_id INT NULL`);
      console.log("Updated orders.user_id to allow NULL");
    }

    const [orderItemColumns] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'order_items'
    `);

    const existingOrderItemColumns = orderItemColumns.map((column) => column.COLUMN_NAME);
    const requiredOrderItemCols = [
      { name: 'product_name', ddl: 'VARCHAR(255) NOT NULL' },
      { name: 'price', ddl: 'DECIMAL(10, 2) NOT NULL' },
      { name: 'quantity', ddl: 'INT NOT NULL' },
      { name: 'total_price', ddl: 'DECIMAL(10, 2) NOT NULL DEFAULT 0' },
    ];

    for (const col of requiredOrderItemCols) {
      if (!existingOrderItemColumns.includes(col.name)) {
        await db.query(`ALTER TABLE order_items ADD COLUMN ${col.name} ${col.ddl}`);
        console.log(`Added ${col.name} to order_items table`);
      }
    }

    if (!existingOrderItemColumns.includes('created_at')) {
      await db.query(`ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log("Added created_at to order_items table");
    }

    if (existingOrderColumns.includes('order_number')) {
      const [indexRows] = await db.query(`
        SHOW INDEX FROM orders WHERE Column_name = 'order_number' AND Non_unique = 0
      `);
      if (!indexRows || indexRows.length === 0) {
        await db.query(`ALTER TABLE orders ADD UNIQUE INDEX idx_order_number (order_number)`);
        console.log("Added unique index on orders.order_number");
      }
    }

    return true;
  } catch (error) {
    console.error("Migration error:", error);
    return false;
  }
}

// Add role column to users table
async function addRoleColumn() {
  try {
    // Check if column exists first
    const result = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role'
    `);

    // Handle both mysql2 formats: [rows, fields] or rows directly
    const columns =
      Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

    if (!columns || columns.length === 0) {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'
      `);
      console.log("Role column added to users table");

      // Update existing admin users
      await db.query(`
        UPDATE users SET role = 'admin' WHERE is_admin = TRUE
      `);
      console.log("Existing admin users updated with admin role");
    } else {
      console.log("Role column already exists");
    }

    return true;
  } catch (error) {
    // Column might already exist - ignore duplicate column error
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("Role column already exists (caught duplicate error)");
      return true;
    }
    console.error("Error adding role column:", error);
    return false;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  Promise.all([migrateDatabase(), addRoleColumn()]).then(() => {
    console.log("Migration complete");
    process.exit(0);
  });
}

module.exports = { migrateDatabase, addRoleColumn };
