"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { useHistory } from "@/lib/history-store";

export default function TopicMap({ groups }) {
  const history = useHistory();
  const [activeTopic, setActiveTopic] = useState(groups[0]?.name ?? "");

  const selectedGroup = groups.find((group) => group.name === activeTopic) ?? groups[0];

  const getChunkStatus = (chunkId) => {
    const attempts = history.filter((entry) => entry.chunkId === chunkId);

    if (attempts.length === 0) {
      return { label: "Not started", score: 0, variant: "muted" };
    }

    const bestScore = Math.max(...attempts.map((attempt) => attempt.scorePercent));
    return bestScore >= 80
      ? { label: "Mastered", score: bestScore, variant: "ok" }
      : { label: "Attempted", score: bestScore, variant: "warn" };
  };

  return (
    <div className="topic-map-grid">
      <div className="card-grid">
        {groups.map((group) => {
          const chunkStatuses = group.chunks.map((chunk) => getChunkStatus(chunk.id));
          const completed = chunkStatuses.filter((status) => status.variant === "ok").length;
          const progress = group.chunks.length === 0 ? 0 : Math.round((completed / group.chunks.length) * 100);
          const isActive = selectedGroup?.name === group.name;

          return (
            <button
              key={group.name}
              type="button"
              className="panel-card"
              onClick={() => setActiveTopic(group.name)}
              style={{
                textAlign: "left",
                borderColor: isActive ? "rgba(112, 151, 255, 0.45)" : undefined,
                background: isActive ? "rgba(91, 124, 255, 0.08)" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.9rem" }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: "0.65rem" }}>
                    Subject
                  </div>
                  <h3 style={{ fontSize: "1.15rem" }}>{group.name}</h3>
                </div>
                <div className={`status-chip ${progress >= 80 ? "ok" : progress > 0 ? "warn" : "muted"}`}>{progress}%</div>
              </div>

              <div style={{ marginBottom: "0.75rem" }} className="subtle-text">
                {group.chunks.length} syllabus chunks
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="stack-md">
        {selectedGroup?.chunks.map((chunk, index) => {
          const status = getChunkStatus(chunk.id);

          return (
            <article
              key={chunk.id}
              className="panel-card"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <div className="stack-md" style={{ gap: "0.55rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "2.2rem",
                      height: "2.2rem",
                      borderRadius: "999px",
                      background: "rgba(91, 124, 255, 0.14)",
                      color: "#dbe6ff",
                      fontWeight: 800,
                    }}
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <h3 style={{ fontSize: "1.1rem" }}>{chunk.title}</h3>
                </div>

                <div className="subtle-text" style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <span>~{chunk.approx_tokens.toLocaleString()} tokens</span>
                  <span>{chunk.cases.length} cases</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {status.variant === "ok" && (
                  <span className="status-chip ok">
                    <CheckCircle2 size={14} />
                    {status.score}%
                  </span>
                )}
                {status.variant === "warn" && (
                  <span className="status-chip warn">
                    <Circle size={14} />
                    {status.score}%
                  </span>
                )}
                {status.variant === "muted" && <span className="status-chip muted">{status.label}</span>}

                <Link href={`/test/${chunk.id}`} className="button-primary">
                  <PlayCircle size={16} />
                  {status.variant === "muted" ? "Start" : "Retry"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
