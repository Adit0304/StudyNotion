const Profile = require("../models/Profile");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress")
const Course = require("../models/Course")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const mongoose = require("mongoose")
const { convertSecondsToDuration } = require("../utils/secToDuration")

exports.updateProfile = async (req, res) => {
	try {
		const { dateOfBirth = "", about = "", contactNumber="",firstName,lastName,gender="" } = req.body;
		const id = req.user.id;

		// Find the profile by id
		const userDetails = await User.findById(id);
		const profile = await Profile.findById(userDetails.additionalDetails);

		// Update the profile fields
		userDetails.firstName = firstName || userDetails.firstName;
		userDetails.lastName = lastName || userDetails.lastName;
		profile.dateOfBirth = dateOfBirth || profile.dateOfBirth;
		profile.about = about || profile.about;
		profile.gender=gender || profile.gender;
		profile.contactNumber = contactNumber || profile.contactNumber;

		// Save the updated profile
		await profile.save();
		await userDetails.save();

		return res.json({
			success: true,
			message: "Profile updated successfully",
			profile,
			userDetails
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

// deleteAccount
// Explore -> how can we schedule this deletion 
exports.deleteAccount = async (req,res) => {
    try {
       // get id
       const id = req.user.id;
       // validation and check if id correct
       const userDetails = await User.findById(id);
       if(!userDetails){
        return res.status(400).json({
            success: false,
            message: "User not found",
        })
       }
       // delete profile
       await Profile.findByIdAndDelete({_id: userDetails.additionalDetails})
        // TODO: HW unenroll user from all enrolled courses
       // delete user
       await User.findByIdAndDelete({_id: id});
      
       // return res 
       return res.status(200).json({
        success:true,
        message: "User Deleted Successfully",
       })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User cannot be deleted, please try later",
        })
    }
}

exports.getAllUserDetails = async(req,res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        return res.status(200).json({
            success: true,
            message: "User Fetched Successfully",
            userDetails: userDetails
        })
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "failed to fetch User Details, please try again",
            error: error.message,
        })
    }
}


exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
}