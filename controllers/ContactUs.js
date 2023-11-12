const mailSender = require('../utils/mailSender')


exports.contactUs = async (req, res) => {
    try {
        const {name, email, mobileNo, message} = req.body;
        if(!name || !email || !message) {
            res.status(403).json({
                success: false,
                message: "Enter all the Required Fields"
            })
        }
        const mailInfo = await mailSender(email, 'From Contact Us', `<html><body>
            Name: ${name} <br/>
            Email: ${email} <br/>
            Mobile No: ${mobileNo ? mobileNo : '-'} <br/>
            Message: ${message} <br/>
        </body></html>`)
        if(mailInfo) {
            res.status(200).json({
                success: true,
                message: "Mail has been Sent Successfully",
            })
        } else {
            res.status(403).json({
                success: false,
                message: "Something Went Wrong while Sending Mail"
            })
        }
    } catch(err) {
        console.log(err)
        return res.status(403).json({
            success: false,
            message: err.message,
        })
    }
}