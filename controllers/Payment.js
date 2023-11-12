const {instance} = require('../config/razorpay');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const mailSender = require('../utils/mailSender');
const {courseEnrollmentEmail} = require('../mail/templates/courseEnrollmentEmail');
const crypto = require('crypto');
const CourseProgress = require('../models/CourseProgress');


exports.capturePayment = async (req, res) => {
    try {
        const {cartTotal} = req.body
        const {courses} = req.body
        const userId = req.user.id
        if(courses.length === 0) {
            return res.status(200).json({
                success: false,
                message: "CourseID Not Found",
            })
        }
        let totalAmount = 0
        for(const course_id of courses) {
            let course;
            try {
                course = await Course.findById(course_id)
                if(!course) {
                    return res.status(200).json({
                        success: false,
                        message: "Could Not Find the Course",
                    })
                }
                const uId = new mongoose.Types.ObjectId(userId)
                if(course.studentsEnrolled.includes(uId)) {
                    return res.status(200).json({
                        success: false,
                        message: "Student Already Enrolled in the Course",
                    })
                }
                if(cartTotal) {
                    totalAmount = cartTotal
                } else {
                    totalAmount += course.price;
                }
                console.log("TOTAL AMOUNT: ", totalAmount)
            } catch(err) {
                console.log(err)
                return res.status(500).json({
                    success: false,
                    message: err.message,
                })
            }
            const options = {
                amount: totalAmount*100,
                currency: "INR",
                receipt: Date.now().toString()
            };
            try {
                const paymentResponse = await instance.orders.create(options)
                return res.status(200).json({
                    success: true,
                    message: paymentResponse,
                })
            } catch(err) {
                console.log(err)
                return res.status(500).json({
                    success: false,
                    message: "Could Not Initiate Order",
                })
            }
        }
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Could not Initiate Order",
        })
    }
}

exports.verifyPayment = async (req, res) => {
    const razorpay_payment_id = req.body.razorpay_payment_id;
    const razorpay_order_id = req.body.razorpay_order_id;
    const razorpay_signature = req.body.razorpay_signature;
    const courses = req.body.courses;
    const userId = req.user.id;
    if(!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Payment Failed",
        })
    }
    let body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update(body.toString()).digest('hex');
    const enrolledStudents = async (courses, userId, res) => {
        if(!courses || !userId) {
            return res.status(400).json({
                success: false,
                message: "Courses or UserId Not Found",
            })
        }
        try {
            for(const course_id of courses) {
                const enrolledCourse = await Course.findByIdAndUpdate(course_id, {
                    $push: {
                        studentsEnrolled: userId,
                    }
                }, {new: true})
                if(!enrolledCourse) {
                    return res.status(400).json({
                        success: false,
                        message: "Course Not Found",
                    })
                }
                const courseProgress = await CourseProgress.create({
                    courseId: course_id,
                    userId: userId,
                    completedVideos: [],
                })
                const enrolledStudent = await User.findByIdAndUpdate(userId, {
                    $push: {
                        courses: course_id,
                        courseProgress: courseProgress._id,
                    }
                }, {new: true})
                const emailResponse = await mailSender(enrolledStudent.email, `Successfully Enrolled into ${enrolledCourse.courseName}`, courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName+' '+enrolledStudent.lastName}`))
                console.log("Email Sent Successfully: ", emailResponse)
            }
        } catch(err) {
            console.log(err)
            return res.status(500).json({
                success: false,
                message: err.message,
            })
        }
    }
    if(expectedSignature === razorpay_signature) {
        await enrolledStudents(courses, userId, res)
        return res.status(200).json({
            success: true,
            message: "Payment Verified",
        })
    }
    return res.status(200).json({
        success: true,
        message: "Payment Failed"
    })
}

exports.sendPaymentSuccessMail = async (req, res) => {
    const {orderId, paymentId, amount} = req.body;
    const userId = req.user.id;
    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please Provide All the Details",
        })
    }
    try {
        const enrolledStudent = await User.findById(userId)
        await mailSender(enrolledStudent.email, "Payment Successful", paymentSuccessMail(`${enrolledStudent.email}`, amount/100, orderId, paymentId))
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Could Not Send Email",
        })
    }
}