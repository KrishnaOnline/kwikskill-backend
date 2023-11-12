const Course = require('../models/Course');
const User = require('../models/User');
const ReviewAndRating = require('../models/ReviewAndRating');
const mongoose = require('mongoose');


exports.createRatingReview = async (req, res) => {
    try {
        const {courseId, review, rating} = req.body;
        const userId = req.user.id;
        const userDetails = await User.findById(userId);
        const courseDetails = await Course.findOne(
            {_id: courseId, studentsEnrolled: {$elemMatch: {$eq: userId}}}
        );
        if(!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Student Not Enrolled in the Course",
            })
        }
        const alreadyReviewed = await ReviewAndRating.findOne({
            user: userId,
            course: courseId,
        });
        if(alreadyReviewed) {
            return res.status(200).json({
                success: false,
                message: "User Already Reviewed",
            })
        }
        const reviewRating = await ReviewAndRating.create({
            rating, review, course: courseId, user: userId,
        });
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    reviewAndRating: reviewRating._id,
                }
            },
            {new: true},
        );
        console.log(updatedCourseDetails);
        return res.status(200).json({
            success: true,
            message: "Review/Rating Created Successfully",
            reviewRating,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

exports.getAverageRating = async (req, res) => {
    try {
        const courseId = req.body.courseId;
        const result = await ReviewAndRating.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: {$avg: "$rating"},
                }
            }
        ]);
        if(result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })
        }
        return res.status(200).json({
            success: true,
            message: "No Ratings Yet, Avg Rating: 0",
            averageRating: 0,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await ReviewAndRating.find({})
                                                .sort({rating: "descending"})
                                                .populate(
                                                    {
                                                        path: "user",
                                                        select: "firstName lastName email image",
                                                    }
                                                )
                                                .populate(
                                                    {
                                                        path: "course",
                                                        select: "courseName",
                                                    }
                                                )
                                                .exec();
        return res.status(200).json({
            success: true,
            message: "All Reviews Fetched Successfully",
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}