const User = require("../models/User");
const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const mailSender = require("../utils/mailSender");
const { default: mongoose } = require("mongoose");
// const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");


// capture the payment and initiate the Razorpay order
exports.capturePayment = async (req,res) => {
    // get courseId and userId
    const {course_id} = req.body;
    const userId = req.user.id;
    // validation
    // valid courseId
    if(!course_id){
        return res.json({
            success: false,
            message: "Please provide valid course ID"
        })
    };
    // valid coursedetail
    let course;
    try {
        course = await Course.findById(course_id);
        if(!course){
            return res.json({
                success: false,
                message: "Couldn't find the course"
            });
        }
        // user already pay for the same course
        // const uid = new mongoose.Types.ObjectId(userId); // string waali id to objectId deprecitaed 
        if(!course.studentsEnrolled.includes(userId)){
            return res.status(200).json({
                success: false,
                message: "Student already enrolled",
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
    

    // order create
    const amount = course.price;
    const currency = "INR";

    const options = {
        amount: amount*100,
        currency,
        recepit: Math.random(Date.now()).toString(),
        notes: {
            courseId: course_id,
            userId,
        }
    };

    try {
        // initiate payment using razorpay
        const paymentRespone = await instance.orders.create(options);
        console.log(paymentRespone);

        // return response
        return res.status(200).json({
            success: true,
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentRespone.id,
            currency: paymentRespone.currency,
            amount: paymentRespone.amount,
        })
    } catch (error) {
        console.log(error);
        return res.json({
            success:false,
            message: "Couldn't initiate order",
        });
    }
    
};

//verify signature of razorpay and server
exports.verifySignature = async (req,res) => {
    const webhookSecret = "12345678";

    const signature = req.headers("x-razorpay-signature"); // ye razorpay ka behavoiur h

    const shasum = crypto.createHmac("sha256", webhookSecret);

    shasum.update(JSON.stringify(req.body)); // shasum object converted to string

    const digest = shasum.digest("hex");

    if(signature === digest) {
        console.log("Payment is Authorized");

        // ye api razorpay ne hit kari h isliye req ki body main nahi milegi user ka course ki id

        const {courseId, userId} = req.body.payload.payment.entity.notes;

        try {
            // find the course and enroll student
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id: courseId},
                {$push: {studentsEnrolled: userId,}},
                {new: true},
            );
            
            if(!enrolledCourse){
                return res.status(500).json({
                    success: false,
                    message: "Course not found",
                })
            }
            console.log(enrolledCourse);

            // find the student and add the course to their list of enrolled courses
            const enrolledStudent = await User.findOneAndUpdate(
                {_id: userId},
                {$push: {courses: courseId},},
                {new: true},
            );
            console.log(enrolledStudent);

            // mail sending
            const emailResponse = await mailSender(
                enrolledStudent.email,
                "Congratulations fromo StudyNotion",
                "Congratulations, you are enrolled into the new Course of StudyNotion",
            );

            console.log(emailResponse);
            return res.status(200).json({
                success: true,
                message: "Signature Verified and Course added"
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            })
        }
    }
    else{
        return res.status(400).json({
            success: false,
            message: "Invalid request of course payment",
        })
    }
};