const express = require('express');
const router = express.Router();

const { createCategory, getAllCategories, categoryPageDetails } = require('../controllers/Category');
const { createCourse, getAllCourses, getCourseDetails, editCourse, getFullCourseDetails, getInstructorCourses, deleteCourse, markAsComplete, getCourseProgress } = require('../controllers/Course');
const { createRatingReview, getAverageRating, getAllRating } = require('../controllers/ReviewAndRating');
const { createSection, updateSection, deleteSection } = require('../controllers/Section');
const { createSubSection, updateSubSection, deleteSubSection } = require('../controllers/SubSection');
const { auth, isStudent, isInstructor, isAdmin } = require('../middlewares/auth');
// const { updateCourseProgress, getCourseProgress } = require('../controllers/CourseProgress');

router.post('/createCourse', auth, isInstructor, createCourse);
router.get('/getAllCourses', getAllCourses);
router.post('/getCourseDetails', getCourseDetails);
router.post('/editCourse', auth, isInstructor, editCourse);
router.post('/getFullCourseDetails', auth, getFullCourseDetails);
router.get('/getInstructorCourses', auth, isInstructor, getInstructorCourses);
router.delete('/deleteCourse', auth, deleteCourse);
router.post('/createCategory', auth, isAdmin, createCategory);
router.get('/getAllCategories', getAllCategories);
router.post('/categoryPageDetails', categoryPageDetails);
router.post('/createSection', auth, isInstructor, createSection);
router.post('/updateSection', auth, isInstructor, updateSection);
router.post('/deleteSection', auth, isInstructor, deleteSection);
router.post('/createSubSection', auth, isInstructor, createSubSection);
router.post('/updateSubSection', auth, isInstructor, updateSubSection);
router.post('/deleteSubSection', auth, isInstructor, deleteSubSection);
router.post('/createRatingReview', auth, isStudent, createRatingReview);
router.get('/getAvgRating', getAverageRating);
router.get('/getAllRating', getAllRating);
router.post('/updateCourseProgress', auth, isStudent, markAsComplete);
router.post('/getCourseProgress', auth, isStudent, getCourseProgress);

module.exports = router;