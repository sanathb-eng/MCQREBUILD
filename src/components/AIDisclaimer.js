import { AlertTriangle, Clock3, Sparkles } from "lucide-react";

const noticeItems = [
  {
    icon: Sparkles,
    title: "AI-generated study aid",
    body: "Each question set is drafted by AI from the selected syllabus chunk. It can be helpful, but it can also be imperfect, incomplete, or unavailable.",
  },
  {
    icon: Clock3,
    title: "Free-tier timing matters",
    body: "This app relies on a free Google AI Studio API key, so speed and reliability depend heavily on the time of day and the amount of live demand on Google's side.",
  },
  {
    icon: AlertTriangle,
    title: "Slow or failed loading is usually upstream congestion",
    body: "If a paper stalls, times out, or refuses to generate, the most likely reason is temporary API overload rather than a problem with your chosen topic or browser.",
  },
];

export default function AIDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <section className="ai-notice is-compact" aria-label="AI availability notice">
        <div className="ai-notice-inline">
          <span className="ai-notice-icon">
            <AlertTriangle size={17} />
          </span>
          <p>
            AI-generated question sets use a free Google AI Studio API. Availability depends on time of day and live
            demand, so slow loading or failed generation usually means the upstream service is temporarily under heavy
            use.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ai-notice" aria-label="AI generation notice">
      <div className="section-copy">
        <div className="eyebrow">AI Generation Notice</div>
        <h2>Important before you begin</h2>
        <p>
          These AI-generated question sets are revision aids. They are not guaranteed to be flawless, and they are not
          guaranteed to be available at every moment.
        </p>
      </div>

      <div className="ai-notice-grid">
        {noticeItems.map(({ icon: Icon, title, body }) => (
          <article key={title} className="ai-notice-item">
            <span className="ai-notice-icon">
              <Icon size={18} />
            </span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
