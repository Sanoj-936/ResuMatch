const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateTopicStudyMaterial, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ message: "Job description is required." })
        }

        let resumeText = ""
        if (req.file) {
            try {
                const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeText = resumeContent.text || ""
            } catch (pdfErr) {
                return res.status(400).json({
                    message: "Failed to parse the uploaded PDF. Please ensure it is a valid, non-corrupted PDF file."
                })
            }
        }

        if (!resumeText.trim() && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({ message: "Please upload a resume PDF or provide a self-description." })
        }

        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return res.status(503).json({
                message: "AI service is not configured. Please add your GOOGLE_GENAI_API_KEY to the Backend .env file."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({ message: "Interview report generated successfully.", interviewReport })

    } catch (err) {
        console.error("Error in generateInterViewReportController:", err.message)
        res.status(500).json({
            message: "Unable to generate interview strategy. Please check your AI API configuration and try again."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        res.status(200).json({ message: "Interview report fetched successfully.", interviewReport })
    } catch (err) {
        console.error("Error in getInterviewReportByIdController:", err.message)
        res.status(500).json({ message: "Failed to fetch interview report." })
    }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({ message: "Interview reports fetched successfully.", interviewReports })
    } catch (err) {
        console.error("Error in getAllInterviewReportsController:", err.message)
        res.status(500).json({ message: "Failed to fetch interview reports." })
    }
}

/**
 * @description Controller to generate resume PDF.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return res.status(503).json({
                message: "AI service is not configured. Please add your GOOGLE_GENAI_API_KEY to the Backend .env file."
            })
        }

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        const { resume, jobDescription, selfDescription } = interviewReport
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (err) {
        console.error("Error in generateResumePdfController:", err.message)
        res.status(500).json({ message: "Failed to generate resume PDF. Please try again." })
    }
}

/**
 * @description Controller to generate study material and MCQ quiz for a specific roadmap topic.
 */
async function generateStudyMaterialController(req, res) {
    try {
        const { interviewReportId, topic } = req.body

        if (!topic || topic.trim().length === 0) {
            return res.status(400).json({ message: "Topic is required." })
        }

        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return res.status(503).json({
                message: "AI service is not configured. Please add your GOOGLE_GENAI_API_KEY to the Backend .env file."
            })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const studyMaterial = await generateTopicStudyMaterial({
            topic,
            jobDescription: jobDescription || "",
            resume: resume || "",
            selfDescription: selfDescription || ""
        })

        res.status(200).json({
            message: "Study material generated successfully.",
            studyMaterial
        })
    } catch (err) {
        console.error("Error in generateStudyMaterialController:", err.message)
        res.status(500).json({ message: "Failed to generate study material. Please try again." })
    }
}

/**
 * @description Controller to record/update topic study completion & quiz score progress.
 */
async function updateTopicProgressController(req, res) {
    try {
        const { interviewReportId, topicName, completed, score, totalQuestions } = req.body

        if (!interviewReportId || !topicName) {
            return res.status(400).json({ message: "interviewReportId and topicName are required." })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        if (!interviewReport.topicProgress) {
            interviewReport.topicProgress = []
        }

        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100

        const existingIndex = interviewReport.topicProgress.findIndex(
            (p) => p.topicName.toLowerCase().trim() === topicName.toLowerCase().trim()
        )

        if (existingIndex >= 0) {
            interviewReport.topicProgress[existingIndex].completed = completed ?? true
            interviewReport.topicProgress[existingIndex].score = score ?? interviewReport.topicProgress[existingIndex].score
            interviewReport.topicProgress[existingIndex].totalQuestions = totalQuestions ?? interviewReport.topicProgress[existingIndex].totalQuestions
            interviewReport.topicProgress[existingIndex].percentage = percentage
        } else {
            interviewReport.topicProgress.push({
                topicName,
                completed: completed ?? true,
                score: score || 0,
                totalQuestions: totalQuestions || 0,
                percentage
            })
        }

        await interviewReport.save()

        res.status(200).json({
            message: "Topic progress updated successfully.",
            topicProgress: interviewReport.topicProgress
        })
    } catch (err) {
        console.error("Error in updateTopicProgressController:", err.message)
        res.status(500).json({ message: "Failed to update topic progress." })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    generateStudyMaterialController,
    updateTopicProgressController
}
