import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container empty-state">
      <div className="panel-card stack-md">
        <h1>Topic not found</h1>
        <p className="subtle-text">That route does not match one of the bundled syllabus chapters.</p>
        <Link href="/" className="button-primary" style={{ alignSelf: "center" }}>
          Return to topic map
        </Link>
      </div>
    </div>
  );
}
