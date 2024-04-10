const express = require('express')
const router = express.Router()
const {protect} = require("../middleware/authMiddleware")
const {checkInGuest, checkOutGuest, registerGuest, getCheckedInGuests} = require("../controllers/guestController")


router.post("/register", protect, registerGuest)
router.get("/allguests", getCheckedInGuests)
router.put("/checkout/:guestId", protect, checkOutGuest)
router.put("/checkin/:guestId", protect, checkInGuest)

module.exports = router