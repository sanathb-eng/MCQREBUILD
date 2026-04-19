"use client";

import Link from "next/link";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHistory } from "@/lib/history-store";

const SUBJECTS = ["IBC", "Competition Law", "FEMA & Foreign Investment", "Companies Act"];
const CHART_GRID = "rgba(90, 31, 47, 0.12)";
const CHART_AXIS = "rgba(88, 62, 58, 0.72)";
const CHART_TOOLTIP_BG = "#fffaf3";
const CHART_TOOLTIP_BORDER = "rgba(90, 31, 47, 0.18)";
const TREND_STROKE = "#5a1f2f";
const TREND_DOT = "#8b5563";
const SUBJECT_OK = "#5f7c47";
const SUBJECT_WARN = "#b07f47";
const SUBJECT_ERR = "#9e5648";

export default function AnalyticsPage() {
  const history = useHistory();

  if (history.length === 0) {
    return (
      <div className="container empty-state">
        <div className="panel-card stack-md">
          <h1>Analytics</h1>
          <p className="subtle-text">Take your first AI-generated paper to begin building your performance record.</p>
          <Link href="/" className="button-primary" style={{ alignSelf: "center" }}>
            Go to topic map
          </Link>
        </div>
      </div>
    );
  }

  const totalQuestions = history.reduce((sum, item) => sum + item.totalCount, 0);
  const totalCorrect = history.reduce((sum, item) => sum + item.correctCount, 0);
  const accuracy = totalQuestions === 0 ? 0 : Math.round((totalCorrect / totalQuestions) * 100);
  const mastered = new Set(history.filter((item) => item.scorePercent >= 80).map((item) => item.chunkId)).size;

  const scoreTrend = [...history].reverse().map((entry, index) => ({
    name: `T${index + 1}`,
    score: entry.scorePercent,
    topic: entry.topicName,
  }));

  const subjectPerformance = SUBJECTS.map((subject) => {
    const tests = history.filter((entry) => entry.majorTopic === subject);
    const questions = tests.reduce((sum, entry) => sum + entry.totalCount, 0);
    const correct = tests.reduce((sum, entry) => sum + entry.correctCount, 0);

    return {
      name: subject.replace(" & ", " &\n"),
      score: questions === 0 ? 0 : Math.round((correct / questions) * 100),
      attempts: tests.length,
    };
  }).filter((subject) => subject.attempts > 0);

  return (
    <div className="container stack-lg">
      <section className="stack-md">
        <div className="section-copy">
          <h1>Analytics</h1>
          <p>Track results across attempts, subjects, and the chapters you appear to have mastered.</p>
        </div>

        <div className="metric-grid">
          <div className="metric-card">
            <div className="label">Accuracy</div>
            <div className="value">{accuracy}%</div>
          </div>
          <div className="metric-card">
            <div className="label">Tests Taken</div>
            <div className="value">{history.length}</div>
          </div>
          <div className="metric-card">
            <div className="label">Questions Answered</div>
            <div className="value">{totalQuestions}</div>
          </div>
          <div className="metric-card">
            <div className="label">Mastered Chunks</div>
            <div className="value">{mastered}</div>
          </div>
        </div>
      </section>

      <section className="chart-grid">
        <div className="panel-card stack-md">
          <h2>Performance Trend</h2>
          <div style={{ height: "320px" }}>
            <ResponsiveContainer>
              <LineChart data={scoreTrend} margin={{ top: 10, right: 12, bottom: 10, left: -18 }}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke={CHART_AXIS} />
                <YAxis domain={[0, 100]} stroke={CHART_AXIS} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_TOOLTIP_BG,
                    borderColor: CHART_TOOLTIP_BORDER,
                    borderRadius: 16,
                  }}
                />
                <Line type="monotone" dataKey="score" stroke={TREND_STROKE} strokeWidth={3} dot={{ r: 4, fill: TREND_DOT }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card stack-md">
          <h2>Accuracy by Subject</h2>
          <div style={{ height: "320px" }}>
            <ResponsiveContainer>
              <BarChart data={subjectPerformance} layout="vertical" margin={{ top: 10, right: 12, bottom: 10, left: 6 }}>
                <CartesianGrid horizontal={false} stroke={CHART_GRID} />
                <XAxis type="number" domain={[0, 100]} stroke={CHART_AXIS} />
                <YAxis type="category" dataKey="name" width={100} stroke={CHART_AXIS} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_TOOLTIP_BG,
                    borderColor: CHART_TOOLTIP_BORDER,
                    borderRadius: 16,
                  }}
                />
                <Bar dataKey="score" radius={[0, 12, 12, 0]}>
                  {subjectPerformance.map((entry) => (
                    <Cell key={entry.name} fill={entry.score >= 80 ? SUBJECT_OK : entry.score >= 50 ? SUBJECT_WARN : SUBJECT_ERR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
