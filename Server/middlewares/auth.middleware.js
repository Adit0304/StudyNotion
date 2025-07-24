const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth
exports.auth = async (req,res,next) => {
    try {
       //extract token
        const token = req.cookies.token 
                    || req.body.token
                    || req.header("Authorisation").replace("Bearer","");
        // if tokeen missing, then return response
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Token is missing",
            });
        }

        //verify the token
        try {
            const decode = jwt.verify(token,process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        } catch (error) {
            //verification issue
            return res.status(401).json({
                success:false,
                message: "Token in Invlaid",
            })
        }
        // If JWT is valid, move on to the next middleware or request handler
		next();
    } catch (error) {
        return res.status(401).json({
            success:false,
            message: "Something went wrong while validating the token",
        })
    }
}

// isStudent
exports.isStudent = async (req,res,next) => {
    try {
        console.log(req.user.id);
        const id = req.user.id;
        const userDetails = await User.findById({_id:id});
        if(userDetails.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message: "This is a protected route for students only",
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: "User Account Type cannot be verified, please try again"
        })
    }
}

// isInstructor
exports.isInstructor = async (req,res,next) => {
    try {   
            console.log("Here ",req.user.accountType);
            if(req.user.accountType !== "Instructor"){
                return res.status(401).json({
                    success:false,
                    message: "This is a protected route for Instructors only",
                })
            }
            next();
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: "User Account Type cannot be verified, please try again"
        })
    }
}


// isAdmin
exports.isAdmin = async (req,res,next) => {
    try {   
            // console.log(req.user.accountType);
            if(req.user.accountType !== "Admin"){
                return res.status(401).json({
                    success:false,
                    message: "This is a protected route for Admins only",
                })
            }
        next();
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: "User Account Type cannot be verified, please try again"
        })
    }
}