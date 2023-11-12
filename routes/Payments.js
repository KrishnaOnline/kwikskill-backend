const express = require('express');
const router = express.Router();

const { capturePayment, verifyPayment, sendPaymentSuccessMail } = require('../controllers/Payment');
const { auth, isStudent, isInstructor, isAdmin } = require('../middlewares/auth');


router.post('/capturePayment', auth, isStudent, capturePayment);
router.post('/verifyPayment', auth, isStudent, verifyPayment);
router.post('/sendPaymentSuccessMail', auth, isStudent, sendPaymentSuccessMail);

module.exports = router;