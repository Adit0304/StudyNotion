const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req,res) => {
    try {
        // data fetch
        const {sectionName, courseId} = req.body;
        // data validate
        if(!sectionName || !courseId){
            return res.status(400).json({
                success: false,
                message: "All fields are required in creating Section",
            })
        }
        // create section
        const newSection = await Section.create({sectionName});
        // update course with section ObjectID
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push:{
                    courseContent: newSection._id,
                }
            },
            {new: true},
        );
        // TODO: Use populate to replace sections/subSections in the updatedCourseDetails
        // return response
        return res.status(200).json({
            success: true,
            message: "Section created Successfully",
            updatedCourseDetails
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to create Section, please try again",
            error: error.message,
        })
    }
}

exports.updateSection = async (req,res) => {
    try {
        // data input
        const {sectionName, sectionId} = req.body;

        // data validate
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success: false,
                message: "All fields are required in updating Section",
            })
        }

        // update
        const section  = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});

        // return res
        return res.status(200).json({
            success: true,
            message: "Section updated Succesfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update Section, please try again",
            error: error.message,
        })
    }
}

exports.deleteSection = async (req,res) => {
    try {
        // get id - assuming that we are sending ID in params
        const {sectionId} = req.params;
        // use findByIdAndDelete
        await Section.findByIdAndDelete(sectionId);
        // TODO[Testing]: Do we need to delete the entry from course schema??
        /// return res
        return res.status(200).json({
            success: true,
            message: "Section Deleted Succesfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete Section, please try again",
            error: error.message,
        })
    }
}