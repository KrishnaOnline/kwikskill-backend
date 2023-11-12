const Profile = require('../models/Profile');
const User = require('../models/User');
const Course = require('../models/Course');
const { cloudinaryImageUpload, cloudinaryImageDelete } = require('../utils/imageUploader');
require('dotenv').config();


exports.updateProfile = async (req, res) => {
    try {
        const {gender, dateOfBirth="", about="", contactNumber} = req.body;
        const id = req.user.id;
        if(!contactNumber || !id) {
            return res.status(400).json({
                success: false,
                message: "Enter All the Required Details", 
            })
        }
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;
        await profileDetails.save();
        return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
            data: profileDetails,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Updating Profile",
        })
    }
}

exports.updateProfilePicture = async (req, res) => {
    try{
        const userId = req.user.id;
        const user = await User.findById(userId);
        if(!user) {
            return res.status(400).json({
                success: false,
                message: "User Not Found",
            })
        }
        const profilePicture = req.files.profilePicture;
        if(!profilePicture) {
            return res.status(400).json({
                success: false,
                message: "Image Not Found",
            })
        }
        if(user.image) {
            const publicId = user.image.split('/').slice(-1)[0].split('.')[0];
            console.log(publicId)
            try {
                await cloudinaryImageDelete(process.env.FOLDER_NAME+'/'+publicId)
            } catch (err) {
                console.log(err);
            }
        }
        user.image = `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName[0]}`
        const uploadedPicture = await cloudinaryImageUpload(profilePicture, process.env.FOLDER_NAME, 10, 200);
        // const userDetails = await User.findById(req.user.id);
        const updatedDetails = await User.findByIdAndUpdate(userId, { image: uploadedPicture.secure_url }, {new: true});
        return res.status(200).json({
            success: true,
            message: "Profile Picture Uploaded Successfully",
            data: updatedDetails,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Please Select Image",
        })
    }
}

//PENDING: When an Account is Deleted, all his Enrolled Courses Should be UnEnrolled
//Also Sheduled Deletion
exports.deleteAccount = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id);
        if(!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User Not Found",
            })
        }
        await Profile.findByIdAndDelete({_id: userDetails.additionalDetails});
        await User.findByIdAndDelete({_id: id});
        return res.status(200).json({
            success: true,
            message: "User Account Deleted Successfully",
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Deleting Account",
        })
    }
}

exports.getAllUserDetails = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        return res.status(200).json({
            success: true,
            message: "All Users Details Fetched Successfully",
            data: userDetails,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Fetching All User Details",
        })
    }
}

exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id
        const userDetails = await User.findById(userId)
                                      .populate({
                                        path: "courses",
                                        populate: {
                                            path: "courseContent",
                                            populate: {
                                                path: "subSection",
                                            }
                                        }
                                      })
                                      .populate("courseProgress")
                                      .exec()
        if(!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could Not Find User with id:${userDetails}`,
            })
        }
        return res.status(200).json({
            success: true,
            data: userDetails,
        })
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

exports.instructorDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id
        const allCourses = await Course.find({instructor: userId})
        console.log("ALL COURSES: ", allCourses)
        const coursesData = allCourses.map(course => {
            const totalStudents = course.studentsEnrolled.length
            const totalIncome = totalStudents * course.price
            const coursesDataStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                totalStudents,
                totalIncome,
            }
            return coursesDataStats
        })
        return res.status(200).json({
            success: true,
            data: coursesData,
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Fetching Instructor Dashboard Stats",
        })
    }
}