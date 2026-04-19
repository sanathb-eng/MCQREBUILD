"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartColumn, BrainCircuit, History } from "lucide-react";

const navItems = [
  { href: "/", label: "Topic Map", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/review", label: "Review", icon: History },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <BrainCircuit size={18} />
          </span>
          <span className="brand-name">CorpLaw Master</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

            return (
              <Link key={href} href={href} className={`nav-link${isActive ? " is-active" : ""}`}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
