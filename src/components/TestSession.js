"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, PlayCircle, XCircle } from "lucide-react";
import { addResult } from "@/lib/history-store";

const QUESTION_COUNTS = [5, 10, 15];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function formatElapsedTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatGenerationError(message) {
  const text = typeof message === "string" ? message : "Failed to generate questions.";
  const normalized = text.toLowerCase();

  if (normalized.includes("gemini_api_key")) {
    return text;
  }

  if (
    normalized.includes("503") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("unavailable") ||
    normalized.includes("overloaded") ||
    normalized.includes("all configured gemini models failed") ||
    normalized.includes("not valid json") ||
    normalized.includes("unexpected token") ||
    normalized.includes("an error occurred")
  ) {
    return "The free AI service is under heavy use right now. Because this app relies on a free AI Studio API key, generation speed depends on the time of day and live demand. Please wait a few minutes and try again.";
  }

  return text;
}

export default function TestSession({ chunkId, chunkData }) {
  const [stage, setStage] = useState("config");
  const [config, setConfig] = useState({ count: 5, difficulty: "Medium" });
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizStartedAt, setQuizStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedElapsedSeconds, setCompletedElapsedSeconds] = useState(0);

  const currentQuestion = questions[currentIndex];
  const correctCount = questions.reduce((total, question, index) => {
    return total + (answers[index] === question.correctAnswer ? 1 : 0);
  }, 0);
  const scorePercent = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);

  useEffect(() => {
    if (stage !== "quiz" || !quizStartedAt) {
      return undefined;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - quizStartedAt) / 1000));
    };

    updateElapsed();
    const intervalId = setInterval(updateElapsed, 1000);

    return () => clearInterval(intervalId);
  }, [stage, quizStartedAt]);

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
      const rawText = await response.text();
      const payload = tryParseJson(rawText);

      if (!response.ok) {
        throw new Error(formatGenerationError(payload?.error || rawText || "Failed to generate questions"));
      }

      if (!payload || !Array.isArray(payload.questions)) {
        throw new Error(
          "The server did not return a valid question set. This usually means the AI provider failed before sending structured output."
        );
      }

      setQuestions(payload.questions);
      setAnswers({});
      setCurrentIndex(0);
      setRevealed(false);
      setElapsedSeconds(0);
      setCompletedElapsedSeconds(0);
      setQuizStartedAt(Date.now());
      setStage("quiz");
    } catch (requestError) {
      clearTimeout(timeoutId);

      if (requestError.name === "AbortError") {
        setError(
          "The request timed out after 90 seconds. On a free AI Studio key, this usually means the upstream API is congested or temporarily unavailable."
        );
      } else {
        setError(formatGenerationError(requestError.message));
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
      elapsedSeconds,
      questions: questions.map((question, index) => ({
        text: question.text,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      })),
    });

    setCompletedElapsedSeconds(elapsedSeconds);
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
          <p className="hero-copy">
            The question set for this topic is drafted only from the selected syllabus chunk already bundled into the app.
          </p>
        </section>
      </div>

      {stage === "config" && (
        <section className="panel-card stack-md" style={{ maxWidth: "46rem" }}>
          <div className="stack-md" style={{ gap: "0.5rem" }}>
            <h2>Question Set Setup</h2>
            <p className="subtle-text">
              Choose the set length and difficulty, then request a fresh AI-generated batch of questions for this exact topic.
            </p>
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

          <div className="message-info">
            <strong style={{ display: "block", marginBottom: "0.35rem" }}>Before generating</strong>
            This question set depends on a free Google AI Studio API key. At some times of day it works quickly, and at
            other times it may slow down, fail, or not load because the upstream API is under heavy use.
          </div>

          {error && <div className="message-error">{error}</div>}

          <button type="button" className="button-primary" onClick={generateQuestions} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" />
                Drafting questions...
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                Generate question set
              </>
            )}
          </button>

          {loading && (
            <p className="subtle-text">
              Free-tier AI generation can take noticeably longer during peak usage windows.
            </p>
          )}
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
              <div className="quiz-meta">
                <div className="status-chip muted">{config.difficulty}</div>
                <div className="timer-chip">
                  <Clock3 size={15} />
                  <span>Reference clock {formatElapsedTime(elapsedSeconds)}</span>
                </div>
              </div>
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
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
          <h2>Question set complete</h2>
          <p className="subtle-text">{chunkData.title}</p>

          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            <div className="metric-card">
              <div className="label">Score</div>
              <div
                className="value"
                style={{
                  color: scorePercent >= 80 ? "var(--ok-ink)" : scorePercent >= 50 ? "var(--warn-ink)" : "var(--err-ink)",
                }}
              >
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
            <div className="metric-card">
              <div className="label">Time</div>
              <div className="value">{formatElapsedTime(completedElapsedSeconds)}</div>
            </div>
          </div>

          <div className={scorePercent >= 80 ? "message-success" : scorePercent >= 50 ? "message-info" : "message-error"}>
            {scorePercent >= 80
              ? "Excellent work. This topic appears to be in strong shape."
              : scorePercent >= 50
                ? "You are close. Another careful pass through this chapter should help settle the details."
                : "This chapter needs another round of review before the next attempt."}
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
                setQuizStartedAt(null);
                setElapsedSeconds(0);
                setCompletedElapsedSeconds(0);
              }}
            >
              Generate another set
            </button>
            <Link href="/review" className="button-primary">
              Open review archive
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
