import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, fetchStudyMaterial, saveTopicProgress } from "../services/interview.api"
import { useContext, useEffect, useState } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()
    const [error, setError] = useState(null)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError(null)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to generate interview strategy. Please try again."
            setError(msg)
            console.error("generateReport error:", error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (id) => {
        setLoading(true)
        setError(null)
        try {
            const response = await getInterviewReportById(id)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to load interview report."
            setError(msg)
            console.error("getReportById error:", error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            console.error("getReports error:", error)
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        setError(null)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to generate resume PDF. Please try again."
            setError(msg)
            console.error("getResumePdf error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStudyMaterial = async (interviewReportId, topic) => {
        setError(null)
        try {
            const response = await fetchStudyMaterial({ interviewReportId, topic })
            return response.studyMaterial
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to generate study material. Please try again."
            setError(msg)
            console.error("getStudyMaterial error:", error)
            return null
        }
    }

    const updateProgress = async ({ interviewReportId, topicName, completed, score, totalQuestions }) => {
        try {
            const response = await saveTopicProgress({ interviewReportId, topicName, completed, score, totalQuestions })
            if (response.topicProgress && report) {
                setReport({
                    ...report,
                    topicProgress: response.topicProgress
                })
            }
            return response.topicProgress
        } catch (error) {
            console.error("updateProgress error:", error)
            return null
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])

    return { loading, report, reports, error, generateReport, getReportById, getReports, getResumePdf, getStudyMaterial, updateProgress }

}
