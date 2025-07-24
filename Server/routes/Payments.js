// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayment, verifySignature,sendPaymentSuccessEmail } = require("../controllers/Payment.controller")
const { auth, isStudent} = require("../middlewares/auth.middleware")

router.post("/capturePayment", auth, isStudent, capturePayment)
router.post("/verifyPayment",auth,verifySignature)
router.post("/sendPaymentSuccessEmail", auth, sendPaymentSuccessEmail)

module.exports = router;