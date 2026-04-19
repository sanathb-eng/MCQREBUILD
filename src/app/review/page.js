"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { useHistory } from "@/lib/history-store";

export default function ReviewPage() {
  const history = useHistory();
  const [expandedId, setExpandedId] = useState(null);

  if (history.length === 0) {
    return (
      <div className="container empty-state">
        <div className="panel-card stack-md">
          <h1>Review</h1>
          <p className="subtle-text">Your saved explanations and answer history will appear here after you complete a test.</p>
          <Link href="/" className="button-primary" style={{ alignSelf: "center" }}>
            Start a test
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container stack-lg">
      <section className="section-copy">
        <h1>Review</h1>
        <p>Open any saved attempt to inspect your answer, the correct option, and the explanation.</p>
      </section>

      <section className="stack-md">
        {history.map((test) => {
          const isExpanded = expandedId === test.id;

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
                      background:
                        test.scorePercent >= 80
                          ? "rgba(34, 197, 94, 0.12)"
                          : test.scorePercent >= 50
                            ? "rgba(245, 158, 11, 0.12)"
                            : "rgba(248, 113, 113, 0.12)",
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
                    borderTop: "1px solid rgba(166, 188, 255, 0.14)",
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
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(166, 188, 255, 0.12)",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.8rem", marginBottom: "0.9rem" }}>
                          <div style={{ paddingTop: "0.1rem" }}>
                            {isCorrect ? <CheckCircle2 size={18} color="#22c55e" /> : <XCircle size={18} color="#f87171" />}
                          </div>
                          <div className="stack-md" style={{ gap: "0.55rem", flex: 1 }}>
                            <p style={{ lineHeight: 1.65 }}>
                              <strong>{index + 1}.</strong> {question.text}
                            </p>
                            <div className="subtle-text">
                              Your answer: <strong style={{ color: isCorrect ? "#bbf7d0" : "#fecaca" }}>{question.userAnswer || "Skipped"}</strong>
                            </div>
                            {!isCorrect && (
                              <div className="subtle-text">
                                Correct answer: <strong style={{ color: "#bbf7d0" }}>{question.correctAnswer}</strong>
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
