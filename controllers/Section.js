const Section = require('../models/Section');
const Course = require('../models/Course');


exports.createSection = async (req, res) => {
    try {
        const {sectionName, courseId} = req.body;
        if(!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Fill All the Details",
            })
        }
        const newSection = await Section.create({sectionName});
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    courseContent: newSection._id,
                }
            },
            {new: true},
        ).populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        }).exec()
        return res.status(200).json({
            success: true,
            message: "Section Creation Successful",
            data: updatedCourse,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while creating Section",
        })
    }
}

exports.updateSection = async (req, res) => {
    try {
        const {sectionName, sectionId, courseId} = req.body;
        if(!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Fill All the Required Ones",
            })
        }
        const section = await Section.findByIdAndUpdate(
            sectionId, {sectionName}, {new: true},
        )
        const course = await Course.findById(courseId)
                                   .populate({
                                        path: "courseContent",
                                        populate: {
                                            path: "subSection",
                                        },
                                   }).exec()
        return res.status(200).json({
            success: true,
            message: "Section Updation Successful",
            data: course,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Updating Section",
        })
    }
}

exports.deleteSection = async (req, res) => {
	try {
		const { sectionId, courseId } = req.body;
		await Section.findByIdAndDelete(sectionId);
		const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
		res.status(200).json({
			success: true,
			message: "Section deleted",
			data: updatedCourse,
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};