const Course = require('../models/Course');
const Category = require('../models/Category');
const User = require('../models/User');
const {cloudinaryImageUpload, cloudinaryImageDelete} = require('../utils/imageUploader');
const CourseProgress = require('../models/CourseProgress');
const { convertSecondsToDuration } = require('../utils/durationConverter');
const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
require('dotenv').config();
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


exports.createCourse = async (req, res) => {
    try {
        const {courseName, courseDescription, whatYouWillLearn, price, category} = req.body;
        let {status} = req.body;
        if(!courseName || !courseDescription /*|| !whatYouWillLearn*/ || !price || !category) {
            return res.status(400).json({
                success: false,
                message: "Fill All the Required Details",
            })
        }
        if(!status || status === undefined) {
            status = "Draft"
        }
        const thumbnail = req.files.thumbnailImage;
        const thumbnailImage = await cloudinaryImageUpload(thumbnail, process.env.FOLDER_NAME, 10);
        const instructorDetails = await User.findById(req.user.id, {
            accountType: "Instructor"
        });
        if(!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor Not Found",
            })
        }
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Not Found",
            })
        }
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            // whatYouWillLearn: whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
        });
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new: true},
        )
        await Category.findByIdAndUpdate(
            {_id: category},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new: true},
        )
        return res.status(200).json({
            success: true,
            message: "Course Created Successfully",
            data: newCourse,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while creating Course",
        })
    }
}

exports.getAllCourses = async (req, res) => {
    try {
        //changes HERE
        const allCourses = await Course.find({}, {
            courseName: true, courseDescription: true, price: true, thumbnail: true, instructor: true, reviewAndRating: true, studentsEnrolled: true,
        }).populate('instructor').exec();
        return res.status(200).json({
            success: true,
            message: "All Courses Fetched Successfully",
            data: allCourses,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while fetching Courses"
        })
    }
}

exports.getCourseDetails = async (req, res) => {
    try {
        const {courseId} = req.body;
        const courseDetails = await Course.findById(courseId)
                                          .populate(
                                            {
                                                path: "instructor",
                                                populate: {
                                                    path: "additionalDetails",
                                                }
                                            }
                                          )
                                          .populate("category")
                                          .populate({
                                            path: "reviewAndRating",
                                            populate: {
                                                path: "user",
                                                select: "firstName lastName accountType image"
                                            }
                                          })
                                          .populate(
                                            {
                                                path: "courseContent",
                                                populate: {
                                                    path: "subSection",
                                                }
                                            }
                                          )
                                          .exec();
        if(!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Course Details Not Found with id: ${courseId}`,
            })
        }
        return res.status(200).json({
            success: true,
            message: "Course Details Fetched Successfully",
            data: {courseDetails, },
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

exports.editCourse = async (req, res) => {
    try {
        const {courseId} = req.body
        const updates = req.body
        const course = await Course.findById(courseId)
        if(!course) {
            return res.status(404).json({
                success: false,
                message: "Course Not Found"
            })
        }
        if(req.files) {
            console.log("Thumbnail Update")
            const thumbnail = req.files.thumbnailImage
            if(course.thumbnail) {
                const publicId = course.thumbnail.split('/').slice(-1)[0].split('.')[0];
                console.log(publicId)
                try {
                    await cloudinaryImageDelete(process.env.FOLDER_NAME+'/'+publicId)
                } catch (err) {
                    console.log(err);
                }
            }
            const updatedThumbnailImage = await cloudinaryImageUpload(thumbnail, process.env.FOLDER_NAME, 10)
            course.thumbnail = updatedThumbnailImage.secure_url
        }
        // if(updates.category) {
        //     // Convert the string to ObjectId
        //     course.category = new ObjectId(updates.category);
        // }
        for(const key in updates) {
            if(updates.hasOwnProperty(key)) {
                if(key === 'tag' || key === 'instructions') {
                    course[key] = JSON.parse(updates[key])
                } else {
                    course[key] = updates[key]
                }
            }
        }
        await course.save()
        const updatedCourse = await Course.findById(courseId).populate({
                                                                path: 'instructor',
                                                                populate: {
                                                                    path: 'additionalDetails'
                                                                }
                                                              })
                                                              .populate('category')
                                                              .populate('reviewAndRating')
                                                              .populate({
                                                                path: 'courseContent',
                                                                populate: {
                                                                    path: 'subSection'
                                                                }
                                                              }).exec()
        return res.status(200).json({
            success: true,
            message: "Course Updated Successfully",
            data: updatedCourse,
        })
    } catch(err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Updating Course",
            error: err.message,
        })
    }
}

exports.getInstructorCourses = async (req, res) => {
    try {
        const userId = req.user.id
        const allInstrCourses = await Course.find({instructor: userId})
        res.status(200).json({
            success: true,
            message: "Instructor Details Fetched",
            data: allInstrCourses,
        })
    } catch(err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Something went Wrong, while fetching Instructor Details",
            error: err.message,
        })
    }
}

exports.getFullCourseDetails = async (req, res) => {
    try {
        const {courseId} = req.body
        const userId = req.user.id
        const courseDetails = await Course.findById(courseId)
                                          .populate({
                                            path: "instructor",
                                            populate: {
                                                path: "additionalDetails",
                                            },
                                          })
                                          .populate("category")
                                          .populate("reviewAndRating")
                                          .populate({
                                            path: "courseContent",
                                            populate: {
                                                path: "subSection",
                                            }
                                          })
                                          .exec()
    let courseProgressCount = await CourseProgress.findOne({courseId: courseId, userId: userId})
    console.log("Course Progress Count: ", courseProgressCount)
    if(!courseDetails) {
        return res.status(400).json({
            success: false,
            message: "Course Not Found",
        })
    }
    let totalDurationInSecs = 0
    courseDetails.courseContent.forEach(content => {
        content.subSection.forEach(subSec => {
            const timeDurationInSecs = parseInt(subSec.timeDuration)
            totalDurationInSecs += timeDurationInSecs
        })
    })
    const totalDuration = convertSecondsToDuration(totalDurationInSecs)
    return res.status(200).json({
        success: true,
        data: {courseDetails, totalDuration, completedVideos: courseProgressCount?.completedVideos ? courseProgressCount?.completedVideos : [],},
        // data: {
        //     courseDetails, totalDuration,
        //     completedVideos: courseProgressCount.completedVideos ? courseProgressCount.completedVideos : [],
        // },
    })
    } catch(err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

exports.deleteCourse = async (req, res) => {
    try {
        const {courseId} = req.body
        const course = await Course.findById(courseId)
        if(!course) {
            return res.status(404).json({
                success: false,
                message: "Course Not Found",
            })
        }
        const studentsEnrolled = course.studentsEnrolled
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: {
                    courses: courseId
                }
            })
        }
        const courseSections = course.courseContent
        for (const secId of courseSections) {
            const section = await Section.findById(secId)
            if(section) {
                const subSecs = section.subSection
                for (const subSecId of subSecs) {
                    await SubSection.findByIdAndDelete(subSecId)
                }
            }
            await Section.findByIdAndDelete(secId)
        }
        // Delete Thumbnail from Cloudinary
        await Course.findByIdAndDelete(courseId)
        return res.status(200).json({
            success: true,
            message: "Course Deleted Successfully",
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something went Wrong, while Deleting Course",
            error: err.message,
        })
    }
}

exports.markAsComplete = async (req, res) => {
    const {courseId, subSectionId} = req.body
    const userId = req.user.id
    if(!courseId || !subSectionId || !userId) {
        return res.status(400).json({
            success: false,
            message: "Provide Required Fields",
        })
    }
    try {
        // const progressExists = await CourseProgress.findOne({ userId: userId, courseId: courseId })
        // const completedVideos = progressExists.completedVideos
        // if(!completedVideos.includes(subSectionId)) {
        //     await CourseProgress.findOneAndUpdate(
        //         {userId: userId, courseId: courseId},
        //         {$push: {completedVideos: subSectionId}},
        //     )
        // } else {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Lecture Already Marked as Completed",
        //     })
        // }
        // await CourseProgress.findOneAndUpdate(
        //     {userId: userId, courseId: courseId},
        //     {completedVideos: completedVideos},
        // )

        const courseProgress = await CourseProgress.findOne({
            courseId: courseId,
            userId: userId,
        })
        console.log(courseProgress)
        if(!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "Course Progress Not Exist",
            })
        } else {
            if(courseProgress.completedVideos.includes(subSectionId)) {
                return res.status(200).json({
                    success: false,
                    message: "Already Updated"
                })
            }
            courseProgress.completedVideos.push(subSectionId)
        }
        await courseProgress.save()
        return res.status(200).json({
            success: true,
            message: "Lecture Marked as Complete",
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Marking as Complete",
        })
    }
}

exports.getCourseProgress = async (req, res) => {
    const {courseId} = req.body
    const userId = req.user.id
    if(!courseId) {
        return res.status(404).json({
            success: false,
            message: "CourseId is Needed",
        })
    }
    try {
        let courseProgress = await CourseProgress.findOne({courseId: courseId, userId: userId})
                                                 .populate({
                                                    path: "courseId",
                                                    populate: {
                                                        path: "courseContent",
                                                    }
                                                 }).exec()
        if(!courseProgress) {
            return res.status(400).json({
                success: false,
                message: "Could Not Find CourseProgress",
            })
        }
        let lectures = 0;
        courseProgress.courseId.courseContent.forEach(section => {
            lectures += section.subSection.length || 0
        })
        let progressPercent = (courseProgress.completedVideos.length / lectures) * 100;
        const multiplier = Math.pow(10, 2)
        progressPercent = Math.round(progressPercent * multiplier) / multiplier
        return res.status(200).json({
            success: true,
            message: "Course Progress Fetched",
            data: {progressPercent, completedVideos, lectures},
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while fetching CourseProgress",
        })
    }
}