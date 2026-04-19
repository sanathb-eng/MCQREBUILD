"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, PlayCircle, XCircle } from "lucide-react";
import { addResult } from "@/lib/history-store";

const QUESTION_COUNTS = [5, 10, 15];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function TestSession({ chunkId, chunkData }) {
  const [stage, setStage] = useState("config");
  const [config, setConfig] = useState({ count: 5, difficulty: "Medium" });
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];
  const correctCount = questions.reduce((total, question, index) => {
    return total + (answers[index] === question.correctAnswer ? 1 : 0);
  }, 0);
  const scorePercent = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);

  async function generateQuestions() {
    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch("/api/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chunkData,
          config,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate questions");
      }

      setQuestions(payload.questions);
      setAnswers({});
      setCurrentIndex(0);
      setRevealed(false);
      setStage("quiz");
    } catch (requestError) {
      clearTimeout(timeoutId);

      if (requestError.name === "AbortError") {
        setError("The generation request timed out after 90 seconds. Check your Vercel function logs and try again.");
      } else {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function finishTest() {
    addResult({
      chunkId,
      topicName: chunkData.title,
      majorTopic: chunkData.topic,
      scorePercent,
      correctCount,
      totalCount: questions.length,
      difficulty: config.difficulty,
      questions: questions.map((question, index) => ({
        text: question.text,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      })),
    });

    setStage("done");
  }

  return (
    <div className="container stack-lg">
      <div className="stack-md" style={{ gap: "0.9rem" }}>
        <Link href="/" className="button-secondary" style={{ alignSelf: "flex-start" }}>
          <ArrowLeft size={16} />
          Back to Topic Map
        </Link>

        <section className="hero-card">
          <div className="eyebrow">{chunkData.topic}</div>
          <h1 style={{ maxWidth: "18ch", fontSize: "clamp(2rem, 4vw, 3.4rem)" }}>{chunkData.title}</h1>
          <p className="hero-copy">This quiz is generated from the exact syllabus chunk already bundled into the app.</p>
        </section>
      </div>

      {stage === "config" && (
        <section className="panel-card stack-md" style={{ maxWidth: "46rem" }}>
          <div className="stack-md" style={{ gap: "0.5rem" }}>
            <h2>Quiz Setup</h2>
            <p className="subtle-text">Choose the question count and difficulty, then generate a fresh mock test.</p>
          </div>

          <div className="stack-md" style={{ gap: "0.75rem" }}>
            <h3>Number of questions</h3>
            <div className="pill-group">
              {QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`pill-button${config.count === count ? " is-active" : ""}`}
                  onClick={() => setConfig((current) => ({ ...current, count }))}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="stack-md" style={{ gap: "0.75rem" }}>
            <h3>Difficulty</h3>
            <div className="pill-group">
              {DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  className={`pill-button${config.difficulty === difficulty ? " is-active" : ""}`}
                  onClick={() => setConfig((current) => ({ ...current, difficulty }))}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="message-error">{error}</div>}

          <button type="button" className="button-primary" onClick={generateQuestions} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" />
                Generating questions...
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                Start mock test
              </>
            )}
          </button>
        </section>
      )}

      {stage === "quiz" && currentQuestion && (
        <section className="stack-md">
          <div className="panel-card stack-md" style={{ gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: "0.55rem" }}>
                  Question {currentIndex + 1} / {questions.length}
                </div>
                <h2>{chunkData.title}</h2>
              </div>
              <div className="status-chip muted">{config.difficulty}</div>
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
            </div>

            <div className="stack-md" style={{ gap: "1rem" }}>
              <p style={{ fontSize: "1.15rem", lineHeight: 1.65 }}>{currentQuestion.text}</p>
              <div>
                {["A", "B", "C", "D"].map((optionKey) => {
                  const isSelected = answers[currentIndex] === optionKey;
                  const isCorrect = revealed && currentQuestion.correctAnswer === optionKey;
                  const isIncorrect = revealed && isSelected && !isCorrect;

                  let className = "option-button";
                  if (isSelected && !revealed) className += " is-selected";
                  if (isCorrect) className += " is-correct";
                  if (isIncorrect) className += " is-incorrect";

                  return (
                    <button
                      key={optionKey}
                      type="button"
                      className={className}
                      disabled={revealed}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [currentIndex]: optionKey,
                        }))
                      }
                    >
                      <span className="option-badge">{optionKey}</span>
                      <span style={{ flex: 1 }}>{currentQuestion.options[optionKey]}</span>
                      {isCorrect && <CheckCircle2 size={18} color="currentColor" />}
                      {isIncorrect && <XCircle size={18} color="currentColor" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {revealed && (
            <div className={answers[currentIndex] === currentQuestion.correctAnswer ? "message-success" : "message-error"}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.5rem", fontWeight: 700 }}>
                {answers[currentIndex] === currentQuestion.correctAnswer ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {answers[currentIndex] === currentQuestion.correctAnswer ? "Correct" : "Incorrect"}
              </div>
              <p style={{ lineHeight: 1.7 }}>{currentQuestion.explanation}</p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {!revealed ? (
              <button
                type="button"
                className="button-primary"
                disabled={!answers[currentIndex]}
                onClick={() => setRevealed(true)}
              >
                Submit answer
              </button>
            ) : (
              <button
                type="button"
                className="button-primary"
                onClick={() => {
                  if (currentIndex < questions.length - 1) {
                    setCurrentIndex((value) => value + 1);
                    setRevealed(false);
                    return;
                  }

                  finishTest();
                }}
              >
                {currentIndex < questions.length - 1 ? "Next question" : "Finish test"}
              </button>
            )}
          </div>
        </section>
      )}

      {stage === "done" && (
        <section className="panel-card stack-md" style={{ maxWidth: "44rem" }}>
          <div className="eyebrow">Completed</div>
          <h2>Test complete</h2>
          <p className="subtle-text">{chunkData.title}</p>

          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <div className="metric-card">
              <div className="label">Score</div>
              <div className="value" style={{ color: scorePercent >= 80 ? "#bbf7d0" : scorePercent >= 50 ? "#fde68a" : "#fecaca" }}>
                {scorePercent}%
              </div>
            </div>
            <div className="metric-card">
              <div className="label">Correct</div>
              <div className="value">{correctCount}</div>
            </div>
            <div className="metric-card">
              <div className="label">Questions</div>
              <div className="value">{questions.length}</div>
            </div>
          </div>

          <div className={scorePercent >= 80 ? "message-success" : scorePercent >= 50 ? "message-info" : "message-error"}>
            {scorePercent >= 80
              ? "Excellent work. This topic is in strong shape."
              : scorePercent >= 50
                ? "You are close. Another pass through this chunk should help lock it in."
                : "This topic needs review before the next attempt."}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                setStage("config");
                setQuestions([]);
                setAnswers({});
                setCurrentIndex(0);
                setRevealed(false);
                setError("");
              }}
            >
              Retry topic
            </button>
            <Link href="/review" className="button-primary">
              Open review history
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
