const Course = require("../models/Course");
const Tag = require("../models/tags");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader")

//create Course Handler function
exports.createCourse = async (req,res) => {
    try {
        // fetch data
        const {courseName, courseDescription, whatYouWillLearn,price,tag} = req.body; // yahan tag id h

        // get thumbnail
        const thumbnail = req.files.thumbnailImage;

        // validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // get Instructor details
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details: ",instructorDetails);
        // TODO: Verify user.id and instructorDetails._id are same

        if(!instructorDetails){
            return res.status(404).json({
                success: false,
                message: "Instructor details not found",
            });
        }

        // check given tag is valid or not
        const tagDetails = await Tag.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success: false,
                message: "Tag Details not found",
            });
        }

        //upload Image to Cloudiinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tagDetails._id,
            thumbnail: thumbnailImage.secure_url,
        })

        // update Instructor with the course
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new: true},
        );

        //update tagSchema
        await Tag.findByIdAndUpdate(
            {_id: tagDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new: true},
        );
        
        // return response
        return res.status(200).json({
            success: true,
            message: "Course Created Successfully",
            data: newCourse,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: error.message,
        });
    }
}

// getAllCourses function handler
exports.showAllCourses = async (req,res) => {
    try {
        const allCourses = await Course.find({}, 
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true,
            }).populate("instructor").exec();

            return res.status(200).json({
                success:true,
                message: "Data for all courses fetched successfully",
                data: allCourses,
            });
            
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot Fetch coourse data",
            error: error.message,
        })
    }
}

// getCourseDetails
exports.getCourseDetails = async (req,res) => {
    try {
        // get id
        const {courseId} = req.body;
        // find course details
        const courseDetails = await Course.findById({_id: courseId})
        .populate({
            path: "instructor",
            populate: "additionalDetails",
        })
        .populate("category")
        .populate("ratingAndreviews")
        .populate({
            path: "courseContent",
            populate:{
                path: "subSection",
            },
        })
        .exec();

        // validate
        if(!courseDetails){
            return res.status(400).json({
                success: false,
                message: `Could not find the course with ${courseId}`,
            })
        }
        // return response
        return res.status(200).json({
            success:true,
            message: "Course details fetched successfully",
            data: courseDetails,
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

