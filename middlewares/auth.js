const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();


exports.auth = async (req, res, next) => {
    try {
        // const authHeader = req.headers.authorization.replace("Bearer ", "")
        // console.log("AuthHeader: ", authHeader)
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");   // req.headers.authorization.split(' ')[1];
        console.log(token);
        if(!token) {
            return res.status(404).json({
                success: false,
                message: "Token Not Found",
            });
        }
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        } catch(err) {
            return res.status(403).json({
                success: false,
                message: "Invalid Token, Please Refresh and Try Again",
            });
        }
        next();
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong",
        })
    }
}

exports.isStudent = async (req, res, next) => {
    try {
        if(req.user.accountType !== 'Student') {
            return res.status(400).json({
                success: false,
                message: "This is a Student Protected Route",
            })
        }
        next();
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: "User Role Cannot be Verified",
        })
    }
}

exports.isInstructor = async (req, res, next) => {
    try {
        if(req.user.accountType !== 'Instructor') {
            return res.status(400).json({
                success: false,
                message: "This is a Instructor Protected Route",
            })
        }
        next();
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: "User Role Cannot be Verified",
        })
    }
}

exports.isAdmin = async (req, res, next) => {
    try {
        if(req.user.accountType !== 'Admin') {
            return res.status(400).json({
                success: false,
                message: "This is a Admin Protected Route",
            })
        }
        next();
    } catch(err) {
        return res.status(500).json({
            success: false,
            message: "User Role Cannot be Verified",
        })
    }
}
