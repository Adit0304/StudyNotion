const Profile = require("../models/Profile");
const User = require("../models/User");

exports.updateProfile = async (req,res) => {
    try {
       // get data and userId
       const {dateOfBirth="",about="",contactNumber, gender} = req.body;

       const id = req.user.id;
       // validate
       if(!contactNumber || !gender || !id){
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        })
       }

       // find profile
       const userDetails = await User.findById(id);
       const profileId = userDetails.additionalDetails;
       const profileDetails = await Profile.findById(profileId);
       // update profile
       profileDetails.dateOfBirth = dateOfBirth;
       profileDetails.about = about;
       profileDetails.gender = gender;
       profileDetails.contactNumber = contactNumber;
       await profileDetails.save();

       // return res
       return res.status(200).json({
        success: true,
        message: "Profile Updated Successfully",
        profileDetails,
       })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to Update Profile, please try again",
            error: error.message,
        })
    }
}

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
        })
    } catch (error) {
        return res.status(200).json({
            success: false,
            message: "failed to fetch User Details, please try again",
            error: error.message,
        })
    }
}