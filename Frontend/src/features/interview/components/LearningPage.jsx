import React, { useState } from 'react'
import '../style/interview.scss'

const LearningPage = ({ topic, data, interviewId, onBack, onComplete, isCompleted, currentProgress }) => {
    const [ userAnswers, setUserAnswers ] = useState({})
    const [ quizSubmitted, setQuizSubmitted ] = useState(false)
    const [ quizScore, setQuizScore ] = useState(0)
    const [ isSubmitting, setIsSubmitting ] = useState(false)

    if (!data) return null

    const {
        topicTitle,
        topicOverview,
        whyItMatters,
        coreConcepts = [],
        beginnerExplanation,
        importantTechnicalConcepts = [],
        practicalExamples = [],
        interviewTips = [],
        commonMistakes = [],
        frequentlyAskedQuestions = [],
        practiceSection,
        mcqQuiz = []
    } = data

    const handleSelectOption = (qIdx, optionIdx) => {
        if (quizSubmitted) return
        setUserAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }))
    }

    const handleSubmitQuiz = async () => {
        let correctCount = 0
        mcqQuiz.forEach((q, idx) => {
            if (userAnswers[idx] === q.correctOptionIndex) {
                correctCount++
            }
        })
        setQuizScore(correctCount)
        setQuizSubmitted(true)

        setIsSubmitting(true)
        if (onComplete) {
            await onComplete({
                topicName: topicTitle || topic,
                completed: true,
                score: correctCount,
                totalQuestions: mcqQuiz.length
            })
        }
        setIsSubmitting(false)
    }

    const handleMarkCompleteOnly = async () => {
        setIsSubmitting(true)
        if (onComplete) {
            await onComplete({
                topicName: topicTitle || topic,
                completed: true,
                score: quizScore,
                totalQuestions: mcqQuiz.length
            })
        }
        setIsSubmitting(false)
    }

    const scorePct = mcqQuiz.length > 0 ? Math.round((quizScore / mcqQuiz.length) * 100) : 100

    return (
        <div className="learning-container">
            {/* Header */}
            <div className="learning-header">
                <button onClick={onBack} className="button secondary-button back-btn">
                    ← Back to Strategy
                </button>
                <div className="learning-header__title-group">
                    <span className="learning-badge">Interactive Study Room</span>
                    <h1>{topicTitle || topic}</h1>
                    {isCompleted && (
                        <span className="completed-tag">✓ Topic Completed ({currentProgress?.percentage || 100}%)</span>
                    )}
                </div>
            </div>

            {/* 1. Topic Overview */}
            <section className="learn-section">
                <h2>1. Topic Overview</h2>
                <div className="learn-box">
                    <p>{topicOverview}</p>
                </div>
            </section>

            {/* 2. Why It Matters */}
            <section className="learn-section">
                <h2>2. Why This Topic Matters for Your Target Role</h2>
                <div className="learn-box learn-box--highlight">
                    <p>{whyItMatters}</p>
                </div>
            </section>

            {/* 3. Core Concepts */}
            {coreConcepts.length > 0 && (
                <section className="learn-section">
                    <h2>3. Concepts You Need to Know</h2>
                    <ul className="concept-list">
                        {coreConcepts.map((concept, i) => (
                            <li key={i}>
                                <span className="concept-bullet">✔</span> {concept}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* 4. Beginner Friendly Explanation */}
            {beginnerExplanation && (
                <section className="learn-section">
                    <h2>4. Beginner-Friendly Explanation</h2>
                    <div className="learn-box learn-box--analogy">
                        <p>{beginnerExplanation}</p>
                    </div>
                </section>
            )}

            {/* 5. Important Technical Concepts */}
            {importantTechnicalConcepts.length > 0 && (
                <section className="learn-section">
                    <h2>5. Important Technical Concepts</h2>
                    <div className="tech-concepts-grid">
                        {importantTechnicalConcepts.map((item, i) => (
                            <div key={i} className="tech-concept-card">
                                <h3>{item.title}</h3>
                                <p>{item.explanation}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 6. Practical Examples */}
            {practicalExamples.length > 0 && (
                <section className="learn-section">
                    <h2>6. Practical Examples & Implementation</h2>
                    {practicalExamples.map((ex, i) => (
                        <div key={i} className="example-card">
                            <h3>{ex.title}</h3>
                            <pre className="code-block">
                                <code>{ex.codeOrExample}</code>
                            </pre>
                            <p className="example-explanation">{ex.explanation}</p>
                        </div>
                    ))}
                </section>
            )}

            {/* 7. Interview Tips */}
            {interviewTips.length > 0 && (
                <section className="learn-section">
                    <h2>7. Expert Interview Tips</h2>
                    <ul className="tip-list">
                        {interviewTips.map((tip, i) => (
                            <li key={i}>
                                <span className="tip-icon">💡</span> {tip}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* 8. Common Mistakes */}
            {commonMistakes.length > 0 && (
                <section className="learn-section">
                    <h2>8. Common Pitfalls & Mistakes to Avoid</h2>
                    <ul className="mistake-list">
                        {commonMistakes.map((m, i) => (
                            <li key={i}>
                                <span className="mistake-icon">⚠️</span> {m}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* 9. Frequently Asked Interview Questions */}
            {frequentlyAskedQuestions.length > 0 && (
                <section className="learn-section">
                    <h2>9. Frequently Asked Interview Questions</h2>
                    <div className="faq-list">
                        {frequentlyAskedQuestions.map((faq, i) => (
                            <div key={i} className="faq-card">
                                <h4>Q: {faq.question}</h4>
                                <p><strong>Model Answer:</strong> {faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 10. Practice Section */}
            {practiceSection && (
                <section className="learn-section">
                    <h2>10. Short Practice Exercise</h2>
                    <div className="practice-box">
                        <p className="practice-summary"><strong>Task:</strong> {practiceSection.summary}</p>
                        <div className="practice-exercise">{practiceSection.exercise}</div>
                        {practiceSection.hints && practiceSection.hints.length > 0 && (
                            <div className="practice-hints">
                                <strong>Hints:</strong>
                                <ul>
                                    {practiceSection.hints.map((h, i) => (
                                        <li key={i}>{h}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 11. MCQ Quiz */}
            {mcqQuiz.length > 0 && (
                <section className="learn-section quiz-section">
                    <h2>11. Practice Quiz ({mcqQuiz.length} Questions)</h2>
                    <div className="quiz-list">
                        {mcqQuiz.map((q, qIdx) => {
                            const isAnswered = userAnswers[qIdx] !== undefined
                            const isCorrect = userAnswers[qIdx] === q.correctOptionIndex

                            return (
                                <div key={qIdx} className={`quiz-card ${quizSubmitted ? (isCorrect ? 'quiz-card--correct' : 'quiz-card--incorrect') : ''}`}>
                                    <p className="quiz-question">{qIdx + 1}. {q.question}</p>
                                    <div className="quiz-options">
                                        {q.options.map((opt, optIdx) => {
                                            const isSelected = userAnswers[qIdx] === optIdx
                                            let optionClass = ''
                                            if (quizSubmitted) {
                                                if (optIdx === q.correctOptionIndex) optionClass = 'opt--correct'
                                                else if (isSelected) optionClass = 'opt--wrong'
                                            } else if (isSelected) {
                                                optionClass = 'opt--selected'
                                            }

                                            return (
                                                <button
                                                    key={optIdx}
                                                    type="button"
                                                    className={`quiz-option ${optionClass}`}
                                                    onClick={() => handleSelectOption(qIdx, optIdx)}
                                                >
                                                    <span className="opt-letter">{String.fromCharCode(65 + optIdx)}</span>
                                                    <span>{opt}</span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {quizSubmitted && (
                                        <div className="quiz-explanation">
                                            <strong>{isCorrect ? '✓ Correct!' : '✕ Incorrect'}</strong> {q.explanation}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Quiz Result & Completion Controls */}
                    <div className="quiz-footer">
                        {!quizSubmitted ? (
                            <button
                                onClick={handleSubmitQuiz}
                                className="button primary-button submit-quiz-btn"
                                disabled={Object.keys(userAnswers).length < mcqQuiz.length}
                            >
                                Submit Quiz &amp; Grade Score
                            </button>
                        ) : (
                            <div className="quiz-result-banner">
                                <div className="result-score">
                                    <h3>Quiz Completed!</h3>
                                    <p className="score-text">Score: <span>{quizScore}</span> / {mcqQuiz.length} ({scorePct}%)</p>
                                </div>
                                <button
                                    onClick={onBack}
                                    className="button primary-button"
                                >
                                    Return to Strategy
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Bottom Mark as Completed Button */}
            {!isCompleted && !quizSubmitted && (
                <div className="mark-complete-bar">
                    <button
                        onClick={handleMarkCompleteOnly}
                        disabled={isSubmitting}
                        className="button primary-button complete-topic-btn"
                    >
                        {isSubmitting ? 'Saving Progress...' : 'Mark Topic as Completed'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default LearningPage
