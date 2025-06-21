const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// create Section

exports.createSubSection = async (req,res) => {
    try {
        // data fetch
        const {sectionId, title,timeDuration,description} = req.body;
        // extract file
        const video = req.files.videoFile;
        // validation
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        // create subsection
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })
        // update section with subsection Id
        const updatedSection = await Section.findByIdAndUpdate(
            {_id: sectionId},
            {
                $push:{
                    subSection: SubSectionDetails._id,
                }
            },
            {new:true});
        // HW: log updated section here, after populate query
        // return res
        return res.status(200).json({
            success: true,
            message: "Sub Section Created Successfully",
            updatedSection,
        })
    } catch (error) {
        return res.status().json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
};

exports.updateSubSection = async (req,res) => {
    try {
        // data input
        const {title,timeDuration,description,subSectionId} = req.body;

        const video = req.files.videoFile;
        // data validate
        if(!title || !timeDuration || !description || !subSectionId || !video){
            return res.status(400).json({
                success: false,
                message: "All fields are required in updating SubSection",
            })
        }

        // upload image to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        // update
        const subSection  = await SubSection.findByIdAndUpdate(
            subSectionId,
            {
                title: title,
                timeDuration: timeDuration,
                description: description,
                videoUrl: uploadDetails.secure_url,
            },
            {new:true});

        // return res
        return res.status(200).json({
            success: true,
            message: "SubSection updated Succesfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update SubSection, please try again",
            error: error.message,
        })
    }
}

exports.deleteSubSection = async (req,res) => {
    try {
        // get id - assuming that we are sending ID in params
        const {subSectionId} = req.params;
        // use findByIdAndDelete
        await SubSection.findByIdAndDelete(subSectionId);
        // TODO[Testing]: Do we need to delete the entry from Section schema??
        /// return res
        return res.status(200).json({
            success: true,
            message: "SubSection Deleted Succesfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete SubSection, please try again",
            error: error.message,
        })
    }
}