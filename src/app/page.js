import AIDisclaimer from "@/components/AIDisclaimer";
import TopicMap from "@/components/TopicMap";
import { topicGroups } from "@/lib/course-data";

export default function Home() {
  return (
    <div className="container stack-lg">
      <section className="hero-card">
        <div className="eyebrow">PROBLEM7</div>
        <h1>Chapter-by-chapter question practice for Corporate Law II.</h1>
        <p className="hero-copy">
          Select a syllabus chunk, generate an AI-drafted question set from that exact material, and keep a running
          record of your attempts, explanations, and performance trends.
        </p>
      </section>

      <AIDisclaimer />

      <section className="stack-md">
        <div className="section-copy">
          <h2>Syllabus Index</h2>
          <p>Choose a chapter, review your progress, and open a question set tied to one precise part of the course.</p>
        </div>
        <TopicMap groups={topicGroups} />
      </section>
    </div>
  );
}
