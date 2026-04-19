import TopicMap from "@/components/TopicMap";
import { topicGroups } from "@/lib/course-data";

export default function Home() {
  return (
    <div className="container stack-lg">
      <section className="hero-card">
        <div className="eyebrow">Corporate Law II</div>
        <h1>Choose a topic and spin up a mock test in seconds.</h1>
        <p className="hero-copy">
          This rebuild is structured for Vercel deployment: static course data is bundled into the app, topic routes are
          precomputed, and the quiz page renders from server-provided data instead of brittle client-side fetches.
        </p>
      </section>

      <section className="stack-md">
        <div className="section-copy">
          <h2>Topic Map</h2>
          <p>Pick a syllabus chunk, see your progress, and launch a generated MCQ set for that exact section.</p>
        </div>
        <TopicMap groups={topicGroups} />
      </section>
    </div>
  );
}
