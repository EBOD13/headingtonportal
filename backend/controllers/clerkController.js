// backend/controllers/clerkController.js
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Clerk = require("../models/clerkModel");
const dotenv = require("dotenv").config();
const sendMail = require("../notification/emails/registeredClerkEmail");
const { logActivity } = require("../utils/activityLogger");

// ======================
// Helpers
// ======================

const generateUserID = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return randomNumber.toString();
};

const generateJWTtoken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15d" });

const capitalize = (str) =>
  str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// ======================
// registerClerk
// ======================
// POST /api/clerks
const registerClerk = asyncHandler(async (req, res) => {
  const { name, password, email, role } = req.body;

  if (!name || !password || !email) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const clerkExist = await Clerk.findOne({ email });
  if (clerkExist) {
    res.status(401);
    throw new Error("User already exist");
  }

  // Ensure unique clerkID
  let userID;
  let isUniqueID = false;

  while (!isUniqueID) {
    userID = generateUserID();
    const existingUser = await Clerk.findOne({ clerkID: userID });
    if (!existingUser) isUniqueID = true;
  }

  // Let the schema pre('save') do the hashing
  const clerk = await Clerk.create({
    name: capitalize(name),
    password,
    email,
    clerkID: userID,
    // Default role = 'clerk' unless explicitly creating admin/supervisor
    role:
      role && ["admin", "supervisor", "clerk", "trainee"].includes(role)
        ? role
        : "clerk",
    isActive: true,
    permissions:
      role === "admin"
        ? [
            "view_residents",
            "edit_residents",
            "delete_residents",
            "view_guests",
            "check_in_guests",
            "check_out_guests",
            "view_reports",
            "generate_reports",
            "manage_clerks",
            "system_settings",
          ]
        : ["view_guests", "check_in_guests", "check_out_guests", "view_residents"],
  });

  // Activity log: Logs who created this clerk
  if (clerk) {
    if (req.clerk) {
      // created by an already-authenticated admin/supervisor
      await logActivity({
        actorId: req.clerk._id,
        action: "clerk_created",
        targetType: "clerk",
        targetId: clerk._id,
        description: `Clerk created: ${clerk.email}`,
        metadata: { role: clerk.role },
      });
    } else {
      // fallback – self-registration
      await logActivity({
        actorId: clerk._id,
        action: "clerk_created",
        targetType: "clerk",
        targetId: clerk._id,
        description: "Clerk self-registered",
        metadata: { email: clerk.email, role: clerk.role },
      });
    }
  }

  // Send welcome email (credentials)
  try {
    sendMail(capitalize(name), email, userID);
  } catch (err) {
    console.error("Error sending clerk welcome email:", err.message);
  }

  if (clerk) {
    res.status(201).json({
      _id: clerk.id,
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      role: clerk.role,
      isActive: clerk.isActive,
      token: generateJWTtoken(clerk._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// ======================
// loginClerk
// ======================
// POST /api/clerks/login
const loginClerk = asyncHandler(async (req, res) => {
  const { clerkCred, password } = req.body;

  const clerk = await Clerk.findOne({
    $or: [{ email: clerkCred }, { clerkID: clerkCred }],
  });

  if (!clerk) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (clerk.isActive === false) {
    return res.status(403).json({
      message: "Account is deactivated. Contact administrator.",
    });
  }

  if (typeof clerk.isLocked === "function" && clerk.isLocked()) {
    return res.status(423).json({
      message: "Account is locked due to multiple failed attempts",
    });
  }

  const passwordMatch = await clerk.matchPassword(password);

  if (!passwordMatch) {
    if (typeof clerk.incLoginAttempts === "function") {
      await clerk.incLoginAttempts();
    }
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (typeof clerk.resetLoginAttempts === "function") {
    await clerk.resetLoginAttempts();
  }

  clerk.lastLogin = new Date();
  await clerk.save();

  // Activity log: login
  await logActivity({
    actorId: clerk._id,
    action: "login",
    targetType: "system",
    targetId: null,
    description: `Clerk logged in: ${clerk.email}`,
    metadata: {
      ip: req.ip,
    },
  });

  res.json({
    _id: clerk._id,
    name: clerk.name,
    email: clerk.email,
    clerkID: clerk.clerkID,
    role: clerk.role,
    isActive: clerk.isActive,
    token: generateJWTtoken(clerk._id),
  });
});

// ======================
// getCurrentClerk
// ======================
// GET /api/clerks/current
const getCurrentClerk = asyncHandler(async (req, res) => {
  const { _id, name, email, clerkID, role, isActive } = await Clerk.findById(
    req.clerk.id
  );
  res.status(200).json({ id: _id, name, email, clerkID, role, isActive });
});

module.exports = {
  registerClerk,
  loginClerk,
  getCurrentClerk,
};
