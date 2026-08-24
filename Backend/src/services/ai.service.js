const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

// Use a stable, active model name
const GEMINI_MODEL = "gemini-3.6-flash"

function getAiClient() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY
    if (!apiKey) {
        throw new Error("GOOGLE_GENAI_API_KEY environment variable is not set.")
    }
    return new GoogleGenAI({ apiKey })
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate matches the job"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question (what they evaluate)"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc."),
        tip: z.string().describe("Strategic interview tip or best practice for answering this question effectively")
    })).describe("An array of AT LEAST 10 (minimum 10 to 12) distinct technical questions specific to job description, resume, and skills"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question using frameworks like STAR"),
        tip: z.string().describe("Actionable tip for structure and delivery")
    })).describe("An array of AT LEAST 10 (minimum 10 to 12) distinct behavioral questions specific to past experience, teamwork, and leadership"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus topic of this day"),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day")
    })).describe("A day-wise preparation plan for the candidate"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const ai = getAiClient()

    const prompt = `Generate a comprehensive interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        STRICT MANDATORY REQUIREMENTS:
                        1. You MUST generate AT LEAST 10 Technical Questions (minimum 10 items in technicalQuestions array).
                        2. You MUST generate AT LEAST 10 Behavioral Questions (minimum 10 items in behavioralQuestions array).
                        3. Each question MUST contain question, intention, answer, and tip fields.
                        4. Technical questions must cover system design, architecture, debugging, coding concepts, performance, and specific resume/job tech stack details.
                        5. Behavioral questions must cover STAR framework scenarios (ownership, conflicts, deadlines, failures, leadership, learning).
`

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)
}


const studyMaterialSchema = z.object({
    topicTitle: z.string().describe("The name of the topic being studied"),
    topicOverview: z.string().describe("Comprehensive overview and breakdown of the topic"),
    whyItMatters: z.string().describe("Why this specific topic is crucial for the target job role"),
    coreConcepts: z.array(z.string()).describe("List of core concepts the candidate must master"),
    beginnerExplanation: z.string().describe("Beginner-friendly intuitive explanation with analogies"),
    importantTechnicalConcepts: z.array(z.object({
        title: z.string().describe("Concept name"),
        explanation: z.string().describe("Detailed technical explanation")
    })).describe("Deep dive into important technical concepts"),
    practicalExamples: z.array(z.object({
        title: z.string().describe("Example scenario title"),
        codeOrExample: z.string().describe("Code snippet, architectural diagram logic, or practical implementation steps"),
        explanation: z.string().describe("Breakdown of the code or example")
    })).describe("Practical real-world code or system architecture examples"),
    interviewTips: z.array(z.string()).describe("Expert tips for discussing this topic in an interview"),
    commonMistakes: z.array(z.string()).describe("Common pitfalls and mistakes candidates make during interviews on this topic"),
    frequentlyAskedQuestions: z.array(z.object({
        question: z.string().describe("Frequently asked interview question on this topic"),
        answer: z.string().describe("Comprehensive model answer")
    })).describe("Top interview FAQs for this topic"),
    practiceSection: z.object({
        summary: z.string().describe("Summary of the practice challenge"),
        exercise: z.string().describe("Hands-on exercise or design challenge for the candidate to attempt"),
        hints: z.array(z.string()).describe("Guidance and hints for solving the exercise")
    }).describe("Hands-on practice section"),
    mcqQuiz: z.array(z.object({
        question: z.string().describe("Multiple choice quiz question testing mastery of this topic"),
        options: z.array(z.string()).describe("Exactly 4 multiple choice options"),
        correctOptionIndex: z.number().describe("0-based index of the correct option (0, 1, 2, or 3)"),
        explanation: z.string().describe("Clear explanation of why the correct answer is right")
    })).describe("5 to 10 interactive multiple-choice quiz questions")
})

async function generateTopicStudyMaterial({ topic, jobDescription, resume, selfDescription }) {
    const ai = getAiClient()

    const prompt = `Generate comprehensive, job-specific learning material and interactive MCQ quiz for the candidate studying:
                        Topic / Skill Gap: ${topic}
                        Job Description: ${jobDescription}
                        Resume Context: ${resume}
                        Self Description: ${selfDescription}

                        INSTRUCTIONS:
                        1. Provide deep, non-generic, practical study material tailored specifically to how this topic applies to the target job description and candidate background.
                        2. Create 5 to 10 high-quality MCQ quiz questions with exactly 4 options each, correct option index (0-3), and detailed explanations.
`

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(studyMaterialSchema),
        }
    })

    return JSON.parse(response.text)
}


async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const ai = getAiClient()

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity.
                    `

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateTopicStudyMaterial, generateResumePdf }
