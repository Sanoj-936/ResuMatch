import React, { useState, useRef } from "react"
import "../style/home.scss"
import { useInterview } from "../hooks/useInterview.js"
import { useNavigate } from "react-router"

const Home = () => {

    const { loading, generateReport, reports, error } = useInterview()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState(null)
    const [localError, setLocalError] = useState("")
    const resumeInputRef = useRef()
    const navigate = useNavigate()

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) {
            setSelectedFile(null)
            return
        }
        if (file.type !== "application/pdf") {
            setLocalError("Only PDF files are accepted. Please select a valid PDF resume.")
            resumeInputRef.current.value = ""
            setSelectedFile(null)
            return
        }
        if (file.size > 3 * 1024 * 1024) {
            setLocalError("File is too large. Maximum allowed size is 3MB.")
            resumeInputRef.current.value = ""
            setSelectedFile(null)
            return
        }
        setLocalError("")
        setSelectedFile(file)
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (resumeInputRef.current) resumeInputRef.current.value = ""
    }

    const handleGenerateReport = async () => {
        setLocalError("")
        if (!jobDescription.trim()) {
            setLocalError("Please paste a job description before generating.")
            return
        }
        if (!selectedFile && !selfDescription.trim()) {
            setLocalError("Please upload a PDF resume or write a self-description.")
            return
        }

        const data = await generateReport({
            jobDescription,
            selfDescription,
            resumeFile: selectedFile || null
        })

        if (data && data._id) {
            navigate(`/interview/${data._id}`)
        }
        // If data is null, the error is shown via the error state from useInterview
    }

    if (loading) {
        return (
            <main className="loading-screen">
                <h1>Generating your interview plan...</h1>
                <p style={{ color: "#aaa", marginTop: "1rem", fontSize: "0.9rem" }}>
                    This may take up to 30 seconds. Please wait.
                </p>
            </main>
        )
    }

    const displayError = localError || error

    return (
        <div className="home-page">

            {/* Page Header */}
            <header className="page-header">
                <h1>Create Your Custom <span className="highlight">Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Error Banner */}
            {displayError && (
                <div className="error-banner" role="alert" style={{
                    background: "#3a1a1a",
                    border: "1px solid #c0392b",
                    borderRadius: "8px",
                    padding: "0.85rem 1.2rem",
                    marginBottom: "1.2rem",
                    color: "#e74c3c",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    maxWidth: "900px",
                    margin: "0 auto 1.2rem"
                }}>
                    <span style={{ fontSize: "1.1rem" }}>??</span>
                    <span>{displayError}</span>
                </div>
            )}

            {/* Main Card */}
            <div className="interview-card">
                <div className="interview-card__body">

                    {/* Left Panel - Job Description */}
                    <div className="panel panel--left">
                        <div className="panel__header">
                            <span className="panel__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className="badge badge--required">Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className="panel__textarea"
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                            value={jobDescription}
                        />
                        <div className="char-counter">{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="panel-divider" />

                    {/* Right Panel - Profile */}
                    <div className="panel panel--right">
                        <div className="panel__header">
                            <span className="panel__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className="upload-section">
                            <label className="section-label">
                                Upload Resume
                                <span className="badge badge--best">Best Results</span>
                            </label>

                            {selectedFile ? (
                                <div className="file-selected" style={{
                                    background: "#1a2a1a",
                                    border: "1px solid #2e7d32",
                                    borderRadius: "8px",
                                    padding: "0.8rem 1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "0.5rem"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                        <span style={{ color: "#4caf50", fontSize: "1.2rem" }}>?</span>
                                        <div>
                                            <div style={{ color: "#c8e6c9", fontWeight: 600, fontSize: "0.9rem" }}>{selectedFile.name}</div>
                                            <div style={{ color: "#81c784", fontSize: "0.78rem" }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "#e57373",
                                            cursor: "pointer",
                                            fontSize: "1.1rem",
                                            padding: "0.2rem 0.5rem"
                                        }}
                                        title="Remove file"
                                    >?</button>
                                </div>
                            ) : (
                                <label className="dropzone" htmlFor="resume">
                                    <span className="dropzone__icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                    </span>
                                    <p className="dropzone__title">Click to upload or drag &amp; drop</p>
                                    <p className="dropzone__subtitle">PDF only (Max 3MB)</p>
                                    <input
                                        ref={resumeInputRef}
                                        hidden
                                        type="file"
                                        id="resume"
                                        name="resume"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className="or-divider"><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className="self-description">
                            <label className="section-label" htmlFor="selfDescription">Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id="selfDescription"
                                name="selfDescription"
                                className="panel__textarea panel__textarea--short"
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                                value={selfDescription}
                            />
                        </div>

                        {/* Info Box */}
                        <div className="info-box">
                            <span className="info-box__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume PDF</strong> or a <strong>Self Description</strong> is required. Uploading a resume gives the best results.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className="interview-card__footer">
                    <span className="footer-info">AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className="generate-btn"
                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className="recent-reports">
                    <h2>My Recent Interview Plans</h2>
                    <ul className="reports-list">
                        {reports.map(report => (
                            <li key={report._id} className="report-item" onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || "Untitled Position"}</h3>
                                <p className="report-meta">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? "score--high" : report.matchScore >= 60 ? "score--mid" : "score--low"}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className="page-footer">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Help Center</a>
            </footer>
        </div>
    )
}

export default Home
