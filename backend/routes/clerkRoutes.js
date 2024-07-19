const express = require("express")
const router = express.Router()
const {protect} = require("../middleware/authMiddleware")
const {registerClerk, loginClerk, getCurrentClerk} = require("../controllers/clerkController")


router.post("/", registerClerk)
router.post("/login", loginClerk)
router.get("/current", protect, getCurrentClerk)

module.exports = router