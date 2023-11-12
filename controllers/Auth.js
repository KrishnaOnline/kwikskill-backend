const User = require('../models/User');
const OTP = require('../models/OTP');
const Profile = require('../models/Profile');
const mailSender = require('../utils/mailSender');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


exports.sendOTP = async (req, res) => {
    try {
        const {email} = req.body;
        const userExists = await User.findOne({email: email});
        if(userExists) {
            return res.status(401).json({
                success: false,
                message: "User Already Registered",
            });
        }
        var otp = otpGenerator.generate(6, {
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });
        const result = await OTP.findOne({otp: otp});
        while(result) {
            otp = otpGenerator.generate(6, {
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({otp: otp});
        }
        const otpPayload = {email, otp};
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);
        res.status(200).json({
            success: true,
            message: "OTP Sent Successfully",
            otp: otp,
        });
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: "OTP Not Sent Successfully, ERROR"
        })
    }
}

exports.signup = async (req, res) => {
    try {
        const {firstName, lastName, email, contactNumber, password, confirmPassword, accountType, otp} = req.body;
        if(!firstName || !lastName || !email || !password || !confirmPassword || !accountType) {
            return res.status(403).json({
                success: false,
                message: "Enter All the Required Details",
            });
        }
        if(password !== confirmPassword) {
            return res.status(401).json({
                success: false,
                message: "Password and Confirm Password Do Not Match",
            })
        }
        const userExist = await User.findOne({email});
        if(userExist) {
            return res.status(401).json({
                success: false,
                message: "User Already Registered, Please Login",
            });
        }
        const recentOTP = await OTP.find({email}).sort({createdAt: -1}).limit(1);
        if(recentOTP.length === 0) {
            return res.status(404).json({
                success: false,
                message: "OTP Not Found",
            })
        } else if(otp !== recentOTP[0].otp) {
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP, Please Try Again",
            })
        }
        const hashedPassword = (await bcrypt.hash(password, 10)).toString();
        const profileDetails = await Profile.create({
            gender: null, 
            dateOfBirth: null, 
            about: null, 
            contactNumber: null,
        })
        const user = await User.create({
            firstName, lastName, email, password: hashedPassword, accountType: accountType, additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName[0]}`, 
        });
        return res.status(200).json({
            success: true,
            message: "User Signed Up Successfully",
            user: user,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Sign Up ERROR, Please Try Again",
        })
    }
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Enter All the Details",
            });
        }
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User Do Not Registered, Please SignUp",
            })
        }
        if(await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '2h',
            });
            // user = user.toObject();
            user.token = token;
            user.password = undefined;
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            return res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "User LoggedIn Successfully",
            })
        } else {
            return res.status(401).json({
                success: false,
                message: "Incorrect Password, Please Try Again",
            })
        }
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Login ERROR, Please Try Again",
        })
    }
}

exports.changePassword = async (req, res) => {
    try {
        const userDetails = await User.findById(req.user.id);
        console.log(userDetails);
        const {oldPassword, newPassword, confirmPassword} = req.body;
        if(!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Enter all the Details",
            });
        }        
        const checkPassword = bcrypt.compare(oldPassword, userDetails.password);
        if(!checkPassword) {
            return res.status(400).json({
                success: false,
                message: "Old Password Do Not Match",
            })
        }
        if(newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "ReEntered Passsord Do Not Match",
            })
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            {password: hashedNewPassword},
            {new: true},
        )
        try {
            const emailResponse = await mailSender(
				updatedUserDetails.email,
				"Password Updated Successfully",
                `Your Account Password with Name: ${updatedUserDetails.firstName} ${updatedUserDetails.lastName} has been Updated Successfully`
			);
        } catch(err) {
            return res.status(403).json({
                success: false,
                message: "Something Went Wrong, while Sending Mail",
            })
        }
        // user.token = null;
        return res.status(200).json({
            success: true,
            message: "Password Changed and Mail Sent Successfully",
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Changing Password"
        })
    }
}