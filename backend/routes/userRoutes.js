const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { authMiddleware, adminMiddleware } = require("../config/jwt");

const adminRegisterGuard = (req, res, next) => {
	const setupToken = process.env.ADMIN_SETUP_TOKEN;
	const providedToken = req.headers["x-admin-setup-token"];

	if (setupToken && providedToken === setupToken) {
		return next();
	}

	if (process.env.NODE_ENV !== "production") {
		return next();
	}

	return authMiddleware(req, res, () => adminMiddleware(req, res, next));
};

const allowSelfOrAdmin = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		return next();
	}

	if (req.user && String(req.user.userId) === String(req.params.id)) {
		return next();
	}

	return res.status(403).json({
		success: false,
		message: "Access denied",
	});
};

// Login
router.post("/login", userController.loginUser);

// Admin Login
router.post("/admin/login", userController.adminLogin);

// Verify admin token
router.get("/admin/verify", authMiddleware, adminMiddleware, userController.verifyAdminToken);

// Admin Register (creates user with role='admin')
router.post("/admin/register", adminRegisterGuard, userController.createAdminUser);

// Create a new user (regular user registration)
router.post("/", userController.createUser);

// Get all users
router.get("/", authMiddleware, adminMiddleware, userController.getAllUsers);

// Get user by email (specific route before generic :id)
router.get("/email/:email", authMiddleware, adminMiddleware, userController.getUserByEmail);

// Get user by ID (generic route after specific ones)
router.get("/:id", authMiddleware, allowSelfOrAdmin, userController.getUserById);

// Update user
router.put("/:id", authMiddleware, allowSelfOrAdmin, userController.updateUser);

// Delete user
router.delete("/:id", authMiddleware, allowSelfOrAdmin, userController.deleteUser);

module.exports = router;
