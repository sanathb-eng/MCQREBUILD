"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { useHistory } from "@/lib/history-store";

function getToneStyles(scorePercent) {
  if (scorePercent >= 80) {
    return { background: "var(--ok-surface)", color: "var(--ok-ink)" };
  }

  if (scorePercent >= 50) {
    return { background: "var(--warn-surface)", color: "var(--warn-ink)" };
  }

  return { background: "var(--err-surface)", color: "var(--err-ink)" };
}

export default function ReviewPage() {
  const history = useHistory();
  const [expandedId, setExpandedId] = useState(null);

  if (history.length === 0) {
    return (
      <div className="container empty-state">
        <div className="panel-card stack-md">
          <h1>Review</h1>
          <p className="subtle-text">Your saved explanations and answer history will appear here after you complete a question set.</p>
          <Link href="/" className="button-primary" style={{ alignSelf: "center" }}>
            Begin a question set
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container stack-lg">
      <section className="section-copy">
        <h1>Review</h1>
        <p>Open any saved question set to inspect your answer, the correct option, and the explanation in full.</p>
      </section>

      <section className="stack-md">
        {history.map((test) => {
          const isExpanded = expandedId === test.id;
          const toneStyles = getToneStyles(test.scorePercent);

          return (
            <article key={test.id} className="panel-card" style={{ overflow: "hidden", padding: 0 }}>
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === test.id ? null : test.id))}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "1.25rem",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "3.2rem",
                      height: "3.2rem",
                      borderRadius: "999px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      ...toneStyles,
                    }}
                  >
                    {test.scorePercent}%
                  </div>

                  <div className="stack-md" style={{ gap: "0.15rem" }}>
                    <h2 style={{ fontSize: "1.05rem" }}>{test.topicName}</h2>
                    <p className="subtle-text">
                      {new Date(test.date).toLocaleDateString()} · {test.majorTopic} · {test.difficulty}
                    </p>
                  </div>
                </div>

                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {isExpanded && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    padding: "0 1.25rem 1.25rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {test.questions.map((question, index) => {
                    const isCorrect = question.userAnswer === question.correctAnswer;

                    return (
                      <div
                        key={`${test.id}-${index}`}
                        style={{
                          padding: "1rem",
                          borderRadius: 18,
                          background: "var(--surface-muted)",
                          border: "1px solid var(--border-soft)",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.8rem", marginBottom: "0.9rem" }}>
                          <div style={{ paddingTop: "0.1rem" }}>
                            {isCorrect ? (
                              <CheckCircle2 size={18} color="var(--ok-ink)" />
                            ) : (
                              <XCircle size={18} color="var(--err-ink)" />
                            )}
                          </div>
                          <div className="stack-md" style={{ gap: "0.55rem", flex: 1 }}>
                            <p style={{ lineHeight: 1.65 }}>
                              <strong>{index + 1}.</strong> {question.text}
                            </p>
                            <div className="subtle-text">
                              Your answer:{" "}
                              <strong style={{ color: isCorrect ? "var(--ok-ink)" : "var(--err-ink)" }}>
                                {question.userAnswer || "Skipped"}
                              </strong>
                            </div>
                            {!isCorrect && (
                              <div className="subtle-text">
                                Correct answer: <strong style={{ color: "var(--ok-ink)" }}>{question.correctAnswer}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="message-info">
                          <strong style={{ display: "block", marginBottom: "0.35rem" }}>Explanation</strong>
                          <p style={{ lineHeight: 1.7 }}>{question.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
