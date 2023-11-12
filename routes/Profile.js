const express = require('express');
const router = express.Router();

const { updateProfile, deleteAccount, getAllUserDetails, updateProfilePicture, getEnrolledCourses, instructorDashboardStats } = require('../controllers/Profile');
const { auth, isStudent, isInstructor, isAdmin } = require('../middlewares/auth');


router.put('/updateProfile', auth, updateProfile);
router.put('/updateProfilePic', auth, updateProfilePicture);
router.delete('/deleteAccount', auth, deleteAccount);
router.get('/getAllUserDetails', auth, getAllUserDetails);
router.get('/getEnrolledCourses', auth, getEnrolledCourses);
router.get('/instructorDashboardStats', auth, isInstructor, instructorDashboardStats);

module.exports = router;