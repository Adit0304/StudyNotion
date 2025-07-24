const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

// createRating
exports.createRating = async (req,res) => {
    try {
        // get user id
        const userId = req.user.id;
        // fetch data from req.body
        const {rating,review,courseId} = req.body;
        console.log("Here");
        // check if user is enrolled or not
        const courseDetails = await Course.findOne(
            {_id: courseId,
            studentsEnrolled: {$elemMatch: {$eq: userId}},
        });
        if(!courseDetails){
            return res.status(404).json({
                success: false,
                message: "Student is not enrolled in the course",
            })
        }
        // check if user already reviewed or not
        const alreadyReviewd = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });
        if(alreadyReviewd){
            return res.status(403).json({
                success: false,
                message: "Course is already reviewed by the user",
            })
        }
        // create rating and review
        console.log("Here");
        const ratingAndReview = await RatingAndReview.create({
            rating,review,
            user: userId,
            course: courseId,
        });
        // update course with this review
        console.log("Here");
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            {_id: courseId},
            {$push: {ratingAndReviews: ratingAndReview._id}},
            {new: true},
        );
        console.log(updatedCourseDetails);
        // return response
        return res.status(200).json({
            success: true,
            message: "Rating and Review created Successfully",
            ratingAndReview,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// getAverageRating
exports.getAverageRating = async (req,res) => {
    try {
        // get courseId
        const courseId = req.body.courseId;
        // calculate avg rating,
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course:new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null, // saare entries in a single group
                    averageRating: {$avg: "$rating"},
                },
            },
        ])
        // return rating
        if(result.length>0){
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })
        }

        // if no ratingAndReview exists
        return res.status(200).json({
            success: true,
            message: "No rating given till now",
            averageRating: 0,
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// getAllRating
exports.getAllRating = async (req,res) => {
    try {
        const allReviews = await RatingAndReview.find({})
        .sort({rating: "desc"})
        .populate({
            path: "user",
            select: "firstName lastName email image",
        })
        .populate({
            path: "course",
            select: "courseName",
        })
        .exec();

        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data: allReviews,
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}