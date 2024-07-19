const express = require('express')
const router = express.Router()
const {protect} = require("../middleware/authMiddleware")
const {checkInGuest, checkOutGuest, registerGuest, getCheckedInGuests, getGuests} = require("../controllers/guestController")

router.get('/', protect, getGuests);
router.post("/register", protect, registerGuest)
router.get("/allguests",protect, getCheckedInGuests)
router.put("/checkout/:guestId", protect, checkOutGuest)
router.put("/checkin/:guestId", protect, checkInGuest)

module.exports = router