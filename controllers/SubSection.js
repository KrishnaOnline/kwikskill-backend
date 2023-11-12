const SubSection = require('../models/SubSection');
const Section = require('../models/Section');
const {cloudinaryImageUpload} = require('../utils/imageUploader');
require('dotenv').config();


exports.createSubSection = async (req, res) => {
    try {
        const {title, description, sectionId} = req.body;
        const video = req.files.video;
        if(!title || !description || !sectionId || !video) {
            return res.status(400).json({
                success: false,
                message: !title ? 'Title Missing' : !description ? 'Desc Missing' : !sectionId ? 'SectionId Missing' : !video ? 'Video Missing' : '',
            })
        }
        const uploadVideo = await cloudinaryImageUpload(video, process.env.FOLDER_NAME, 10);
        const subSectionDetails = await SubSection.create({
            title: title,
            description: description,
            videoUrl: uploadVideo.secure_url,
            timeDuration: uploadVideo.duration,
        })
        const updatedSection = await Section.findByIdAndUpdate(
            {_id: sectionId}, 
            {
                $push: {
                    subSection: subSectionDetails._id,
                }
            }, 
            {new: true}
        ).populate("subSection").exec();
        console.log(updatedSection);
        return res.status(200).json({
            success: true,
            message: "Created SubSection Successfully",
            data: updatedSection,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Creating SubSection",
            error: err.message,
        })
    }
}

exports.updateSubSection = async (req, res) => {
    try {
        const {title, description, sectionId, subSectionId} = req.body;
        const subSection = await SubSection.findById(subSectionId)
        if(!subSection) {
            return res.status(400).json({
                success: false,
                message: "SubSection Not Found",
            })
        }
        if(title !== undefined) {
            subSection.title = title
        }
        if(description !== undefined) {
            subSection.description = description
        }
        if(req.files && req.files !== undefined) {
            const video = req.files.video
            if(subSection.videoUrl) {
                const publicId = user.image.split('/').slice(-1)[0].split('.')[0];
                console.log(publicId)
                try {
                    await cloudinaryImageDelete(process.env.FOLDER_NAME+'/'+publicId)
                } catch (err) {
                    console.log(err);
                }
            }
            const uploadVideo = await cloudinaryImageUpload(video, process.env.FOLDER_NAME, 10)
            subSection.videoUrl = uploadVideo.secure_url
            subSection.timeDuration = uploadVideo.duration
        }
        await subSection.save()
        const updatedSection = await Section.findById(sectionId).populate("subSection")
        return res.status(200).json({
            success: true,
            message: "SubSection Updated Succesfully",
            data: updatedSection,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Updating SubSection",
        })
    }
}

exports.deleteSubSection = async (req, res) => {
    try {
        const {sectionId, subSectionId} = req.body
        await Section.findByIdAndUpdate(
            sectionId,
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )
        const subSection = await SubSection.findByIdAndDelete(subSectionId)
        if(!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection Not Found",
            })
        }
        const updatedSection = await Section.findById(sectionId).populate("subSection")
        return res.status(200).json({
            success: true,
            message: "SubSection Deleted Successfully",
            data: updatedSection,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong, while Deleting SubSection",
        })
    }
}