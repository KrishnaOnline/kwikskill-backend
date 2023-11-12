const mongoose = require('mongoose');
const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const CourseProgress = require('../models/CourseProgress');
const Course = require('../models/Course');


// exports.updateCourseProgress = async (req, res) => {
//     const {courseId, subSectionId} = req.body
//     const userId = req.user.id
//     try {
//         const subSection = await SubSection.findById(subSectionId)
//         if(!subSection) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid SubSection"
//             })
//         }
//         let courseProgress = await CourseProgress.findOne({ courseId: courseId, userId: userId })
//         if(!courseProgress) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Something is Wrong at Course Progress",
//             })
//         } else {
//             if(courseProgress.completedVideos.includes(subSectionId)) {
//                 return res.status(200).json({
//                     success: false,
//                     message: "SubSection Already Completed"
//                 })
//             }
//             courseProgress.completedVideos.push(subSectionId)
//         }
//         await courseProgress.save()
//         return res.status(200).json({
//             success: true,
//             message: "CourseProgress Updated Successfully"
//         })
//     } catch(err) {
//         console.log(err)
//         return res.status(500).json({
//             success: false,
//             message: "Something Went Wrong while Updating CourseProgress",
//         })
//     }
// }

exports.getCourseProgress = async (req, res) => {
    const {courseId} = req.body
    const userId = req.user.id
    if(!courseId) {
        return res.status(400).json({
            success: false,
            message: "CourseId is Needed"
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
            data: progressPercent,
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while fetching CourseProgress",
        })
    }
}