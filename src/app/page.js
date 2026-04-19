import AIDisclaimer from "@/components/AIDisclaimer";
import TopicMap from "@/components/TopicMap";
import { topicGroups } from "@/lib/course-data";

export default function Home() {
  return (
    <div className="container stack-lg">
      <section className="hero-card">
        <div className="eyebrow">Corporate Law II Revision</div>
        <h1>An elegant, chapter-by-chapter way to rehearse the syllabus.</h1>
        <p className="hero-copy">
          Select a syllabus chunk, generate an AI-drafted multiple-choice paper from that exact material, and keep a
          running archive of your attempts, explanations, and performance trends.
        </p>
      </section>

      <AIDisclaimer />

      <section className="stack-md">
        <div className="section-copy">
          <h2>Syllabus Index</h2>
          <p>Choose a chapter, review your progress, and open a paper tied to one precise part of the course.</p>
        </div>
        <TopicMap groups={topicGroups} />
      </section>
    </div>
  );
}
