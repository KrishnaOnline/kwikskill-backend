const Category = require('../models/Category');


exports.createCategory = async (req, res) => {
    try {
        const {name, description} = req.body;
        if(!name) {
            return res.status(400).json({
                success: false,
                message: "Enter All the Details",
            })
        }
        const categoryDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log(categoryDetails);
        return res.status(200).json({
            success: true,
            message: "Category Created Successfully",
        })
    } catch(err) {
        console.log(err);
        return res.status(400).json({
            success: false,
            message: "Something Went Wrong, while creating Category",
        })
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const allCategories = await Category.find({}, {name: true, description: true});
        return res.status(200).json({
            success: true,
            message: "All Categories Fetched Successfully",
            data: allCategories,
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Someting Went Wrong, while getting Categories",
        })
    }
}

exports.categoryPageDetails = async (req, res) => {
    try {
        const {categoryId} = req.body;
        const selectedCategory = await Category.findById(categoryId)
                                               .populate({
                                                   path: "courses",
                                                   match: {status: "Published"},
                                                   populate: "reviewAndRating instructor",
                                               })
                                               .exec();
        if(!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category Not Found"
            })
        }
        if(selectedCategory.courses.length === 0) {
            console.log("No Courses Created for this Category")
        }
        const otherCategories = await Category.find({
            _id: {$ne: categoryId,}
        })
        let differentCategory = await Category.findOne(
            otherCategories[Math.floor(Math.random(otherCategories.length))]._id
        ).populate({
            path: "courses",
            match: {status: "Published"},
            populate: "reviewAndRating instructor",
        })
        .exec()
        const allCategories = await Category.find()
                                            .populate({
                                                path: "courses",
                                                match: { status: "Published" },
                                                populate: {
                                                    path: "instructor",
                                                }
                                            })
                                            .exec()
        const allCourses = allCategories.flatMap(category => category.courses)
        const mostSellingCourses = allCourses.sort((a,b) => b.sold - a.sold).slice(0, 10)
        return res.status(200).json({
            success: true,
            data: {
                selectedCategory, differentCategory, mostSellingCourses,
            }
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}