const User = require("../models/User")
const OTP = require("../models/OTP")
const otpGenerator = require("otp-generator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const Profile = require("../models/Profile")
require("dotenv").config();

//sendOTP
exports.sendOTP = async (req,res) => {
    try {
        // fetch email from body
        const {email} = req.body;

        //check if user already exits
        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User already registered",
            })
        }

        //generateOTP
        var otp = otpGenerator.generate(6,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP generated: ",otp);

        //check unique otp or not
        const result = await OTP.findOne({otp: otp});

        while(result){
            otp = otpGenerator.generate(6,{
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({otp: otp});
        }

        const otpPayload =  {email,otp};

        //create an entry for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return response successful
        res.status(200).json({
            success: true,
            message: "OTP Sent Successfully",
            otp,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: error.message,
        })
    }
}

// signUp
exports.signUp = async function (req,res) {
    try {
        // data fetch from request
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;
        // validate kro
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            })
        }
        // 2 password match
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message: "Password and ConfirmPassowrd doesn't match"
            })
        }
        // check user already exits or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                successs:false,
                message: "User is already registered",
            })
        }

        /// find most recent OTP
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1); // ye ek query h

        // console.log("recent Otp is",recentOtp);
        // console.log("recent Otp is",recentOtp.otp);
        // console.log("User Otp is",otp);
        // validate OTP
        if(recentOtp.length == 0){
            return res.status(400).json({
                successs:false,
                message: "OTP Not Found",
            })
        } else if(otp !== recentOtp[0].otp){
            return res.status(400).json({
                successs:false,
                message: "Invalid OTP",
            })
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password,10);

        let approved = ""
        approved === "Instructor" ? (approved = false) : (approved = true)

        //entry create in DB
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null
        })

        const userDetails = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            contactNumber,
            additionalDetails: profileDetails._id,
            image: `https://avatar.oxro.io/avatar.svg?name=${firstName}+${lastName}&background=6ab04ccolor=fff&length=2&bold=true`,
        })
        // return res
        res.status(200).json({
            success: true,
            message: "User is registered Successfully",
            user: userDetails,
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again"
        })
    }
}

//Login
exports.login = async (req,res) => {
    try {
        // get user details from req
        const {email,password} = req.body;
        // validation 
        if(!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All fields aree complusory",
            });
        }
        // user check exist or not
        const user = await User.findOne({email});
        if(!user){
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success: false,
                message: "User is not registered, please signup first",
            });
        }
        // generate JWT token, after passoword matching
        if(await bcrypt.compare(password,user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType, // ye kya h
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "24h",
            });
            user.token = token;
            user.password = undefined; // ye kyu?
            
            // create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token",token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Logged in succesfully",
            })
        }
        else{
            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            });
        }
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Login failure, Please try again",
        });
    }
    
}

//changePassword
exports.changePassword = async (req, res) => {
	try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if(oldPassword === newPassword){
			return res.status(400).json({
				success: false,
				message: "New Password cannot be same as Old Password",
			});
		}
		
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		// Match new password and confirm new password
		if (newPassword !== confirmNewPassword) {
			// If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				"Study Notion - Password Updated",
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};