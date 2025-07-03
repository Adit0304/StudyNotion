const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

//changePasswordToken
exports.resetPasswordToken = async (req,res) => {
    try {
        // get email from req.body
        const email = req.body.email;
        // check user for this email, email validation
        const user = await User.findOne({email: email})
        if(!user){
            return res.status().json({
                success: false,
                message: "Your Email is not registered with us"
            });
        }
        // token generation for frontend link to differ the link such that every link is diff.
        const token = crypto.randomBytes(20).toString("hex");

        // update user by adding token and expiry time
        const updatedDetails = await User.findOneAndUpdate({email:email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 3600000,
            },
            {new: true}); // isse updated document jayega response main 
        
        // create url
        const url = `https://localhost:3000/update-password/${token}`

        // Send mail containing the url
        await mailSender(email,
            "Password Reset",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        );
        
        // return response
        return res.json({
            success: true,
            message: "Email sent successfully, please check email and change password",
        })
    
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong while resetting the password",
        })
    }    
}

//changePassword
exports.resetPassword = async (req,res) => {
    try {
        // data fetch
        const {password,confirmPassword, token} = req.body;
        // validation
        if(!password!== confirmPassword) {
            return res.json({
                success: false,
                message: "password and confirmPassword doesn't match",
            });
        }
        // get userdetails from db using token
        const userDetails = await User.findOne({token: token});
        // if no entry then invalid token 
        if(!userDetails){
            return res.json({
                success: false,
                message: "Invalid User from token",
            })
        }
        // token time check
        if(userDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success: false,
                message: "Token has expired, please try again",
            })
        }
        // hash the new password
        const hashedPassword = await bcrypt.hash(password,10);
        // update password
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
            {new: true},
        )
        // return response
        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: true,
            message: "Something went wrong while changing the password, please try again",
        })
    }
}