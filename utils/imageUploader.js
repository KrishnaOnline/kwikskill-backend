const cloudinary = require('cloudinary').v2;


exports.cloudinaryImageUpload = async (file, folder, quality, height) => {
    const options = {folder};
    if(quality) {
        options.quality = quality;
    }
    if(height) {
        options.height = height;
    }
    options.resource_type = 'auto';
    return await cloudinary.uploader.upload(file.tempFilePath, options);
}

exports.cloudinaryImageDelete = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return result
    } catch(err) {
        throw err
    }
}