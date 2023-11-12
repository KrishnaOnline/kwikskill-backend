const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config()


exports.resetPasswordToken = async (req, res) => {
    try {
        const {email} = req.body;
        const userExist = await User.findOne({email});
        if(!userExist) {
            return res.status(403).json({
                success: false,
                message: "User Do Not Exist",
            })
        }
        const token = crypto.randomUUID();
        const updatedDetails = await User.findOneAndUpdate(
            {email: email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 5*60*1000,
            }
        )
        const url = process.env.FRONTEND_URL+`/resetPassword/${token}`;
        await mailSender(email, "Password Reset Link", `Link: ${url}`);
        return res.status(200).json({
            success: true,
            message: "Password Reset Link Sent Successfully",
            url,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something went Wrong, while Reset Password Mailing",
        })
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const {password, confirmPassword, token} = req.body;
        if(!password || !confirmPassword) {
            return res.status(403).json({
                success: false,
                message: "Enter all the Details",
            })
        }
        if(password !== confirmPassword) {
            return res.status(403).json({
                success: false,
                message: "Password and Confirm Passwords Do Not Match"
            })
        }
        const userDetails = await User.findOne({token: token});
        if(!userDetails) {
            return res.status(400).json({
                success: false,
                message: "Invalid Token",
            })
        }
        if(userDetails.resetPasswordExpires < Date.now()) {
            return res.json(400).json({
                success: false,
                message: "Password Reset Link expired, Please Try Again",
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
            {new: true},
        )
        return res.status(200).json({
            success: true,
            message: "Password Reset Successful"
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong while Resetting Password, Please Try Again",
        })
    }
}