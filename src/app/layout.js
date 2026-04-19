import "./globals.css";
import AIDisclaimer from "@/components/AIDisclaimer";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "CorpLaw Master",
  description: "Corporate Law II mock tests, analytics, and answer review.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="site-notice-shell">
          <div className="container">
            <AIDisclaimer compact />
          </div>
        </div>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
