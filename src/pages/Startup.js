import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function UploadIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8 12 3 7 8" />
      <path d="M12 3v12" />
    </svg>
  );
}

function ImageIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

function LayoutIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="16" height="14" x="4" y="5" rx="2" />
      <path d="M4 10h16" />
      <path d="M9 10v9" />
    </svg>
  );
}

function LayersIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FileIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

function MoonIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 7.8A9 9 0 1 1 12 3Z" />
    </svg>
  );
}

function SunIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

const lightTheme = {
  "--page-bg": "#eeece5",
  "--page-text": "#101010",
  "--muted": "#6f716f",
  "--accent": "#167765",
  "--accent-hover": "#106456",
  "--accent-soft": "#e4f5f1",
  "--panel": "#ffffff",
  "--panel-soft": "#f1efe9",
  "--border": "#dedbd3",
  "--border-soft": "#e5e1d9",
  "--line": "#e8e4dc",
  "--nav-bg": "rgba(244, 242, 236, 0.95)",
  "--shadow": "0 14px 32px rgba(20, 20, 20, 0.06)",
};

const darkTheme = {
  "--page-bg": "#101411",
  "--page-text": "#f6f4ee",
  "--muted": "#aeb8b0",
  "--accent": "#38bfa4",
  "--accent-hover": "#2fa98f",
  "--accent-soft": "#173b35",
  "--panel": "#171d19",
  "--panel-soft": "#202821",
  "--border": "#33413a",
  "--border-soft": "#2a352f",
  "--line": "#34433c",
  "--nav-bg": "rgba(16, 20, 17, 0.94)",
  "--shadow": "0 16px 38px rgba(0, 0, 0, 0.28)",
};

function getInitialDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const savedTheme = window.localStorage.getItem("writecheck-theme");

  if (savedTheme) {
    return savedTheme === "dark";
  }

  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

const stats = [
  ["97%", "Metric label: add accuracy result"],
  ["<30s", "Metric label: add scan time"],
  ["50M+", "Metric label: add source count"],
];

const steps = ["Upload", "Detect", "Transcribe", "Check"];

const features = [
  {
    title: "Text region detection",
    copy:
      "Feature description: explain how the system finds handwritten text areas in an uploaded essay scan.",
    icon: LayoutIcon,
  },
  {
    title: "Handwriting OCR",
    copy:
      "Feature description: explain how handwriting is converted into editable text for checking.",
    icon: LayersIcon,
  },
  {
    title: "Source matching",
    copy:
      "Feature description: explain what sources the essay is compared against for plagiarism detection.",
    icon: SearchIcon,
  },
  {
    title: "PDF reports",
    copy:
      "Feature description: explain what information the final report includes for teachers or reviewers.",
    icon: FileIcon,
  },
];

export default function Startup() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    window.localStorage.setItem("writecheck-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const updateActiveSection = () => {
      const sectionIds = ["home", "about"];
      const scrollMarker = window.scrollY + 180;

      const currentSection = sectionIds.reduce((current, sectionId) => {
        const section = document.getElementById(sectionId);

        if (!section) {
          return current;
        }

        return section.offsetTop <= scrollMarker ? sectionId : current;
      }, "home");

      setActiveSection(currentSection);
    };

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, []);

  const getNavLinkClass = (sectionId) =>
    activeSection === sectionId
      ? "text-[var(--page-text)] transition"
      : "transition hover:text-[var(--page-text)]";

  return (
    <div
      className="min-h-screen bg-[var(--page-bg)] text-[var(--page-text)] antialiased transition-colors duration-300"
      style={isDark ? darkTheme : lightTheme}
    >
      <nav className="fixed inset-x-0 top-0 z-20 border-b border-[var(--border)] bg-[var(--nav-bg)] px-5 py-4 shadow-[var(--shadow)] backdrop-blur">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-5">
          <a
            href="#home"
            className="flex min-w-fit items-center gap-3 text-xl font-black text-[var(--page-text)]"
            aria-label="WriteCheck AI home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent)] text-white">
              <ImageIcon className="h-5 w-5" />
            </span>
            <span>WriteCheck AI</span>
          </a>

          <div className="hidden items-center gap-8 text-base font-bold text-[var(--muted)] md:flex lg:text-lg">
            <a href="#home" className={getNavLinkClass("home")}>
              Home
            </a>
            <a href="#about" className={getNavLinkClass("about")}>
              About
            </a>
            <a href="mailto:hello@writecheck.ai" className="transition hover:text-[var(--page-text)]">
              Contact
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsDark((current) => !current)}
              className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] bg-[var(--panel-soft)] text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--page-text)]"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={isDark}
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg px-3 text-base font-extrabold text-[var(--page-text)] transition hover:bg-[var(--panel)] sm:px-5 sm:text-lg"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-base font-extrabold text-white transition hover:bg-[var(--accent-hover)] sm:px-6 sm:text-lg"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1160px] px-6 pb-32 pt-32 sm:px-10 lg:pt-40">
        <section
          id="home"
          className="grid min-h-[660px] scroll-mt-32 items-start gap-16 lg:scroll-mt-40 lg:grid-cols-[1fr_0.95fr]"
        >
          <div>
            <p className="mb-6 text-xs font-extrabold uppercase tracking-normal text-[var(--accent)]">
              Hero label: add short tagline
            </p>

            <h1 className="max-w-[720px] text-balance text-4xl font-black leading-[1.08] tracking-normal sm:text-5xl lg:text-6xl xl:text-[4.75rem]">
              Detect plagiarism in handwritten essays
            </h1>

            <p className="mt-8 max-w-[510px] text-lg font-medium leading-8 text-[var(--muted)] sm:text-xl">
              Hero description: explain the main value of checking uploaded
              handwritten essays for plagiarism.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--accent)] px-6 text-base font-extrabold text-white shadow-sm transition hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]"
              >
                Get started free
              </Link>

              <a
                href="#about"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] px-6 text-base font-extrabold text-[var(--page-text)] transition hover:bg-[var(--panel)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]"
              >
                See how it works
              </a>
            </div>

            <div className="mt-14 grid max-w-[530px] grid-cols-3 gap-6 border-t border-[var(--border)] pt-8">
              {stats.map(([value, label]) => (
                <div key={label}>
                  <strong className="block text-4xl font-black leading-none">
                    {value}
                  </strong>
                  <span className="mt-2 block text-sm font-bold text-[var(--muted)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
            <div className="flex h-14 items-center gap-3 border-b border-[var(--border-soft)] px-6">
              <span className="h-3 w-3 rounded-full bg-[#ff5b57]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2f]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-4 text-base font-bold text-[var(--muted)]">
                essay_scan.png
              </span>
            </div>

            <div className="px-10 py-7 sm:px-8">
              <div className="flex min-h-[308px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--panel)] px-6 text-center">
                <span className="mb-6 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <UploadIcon className="h-9 w-9" />
                </span>
                <p className="text-xl font-extrabold">
                  Upload area title: add essay scan instruction
                </p>
                <p className="mt-4 max-w-[330px] text-base font-semibold leading-7 text-[var(--muted)]">
                  Upload description: list accepted file formats, file size
                  limit, or upload guidance.
                </p>
              </div>

              <div className="mt-7 grid grid-cols-4 items-start gap-4">
                {steps.map((step, index) => (
                  <div key={step} className="relative text-center">
                    {index < steps.length - 1 && (
                      <span className="absolute left-[58%] top-5 hidden h-px w-[84%] bg-[var(--line)] sm:block" />
                    )}
                    <span className="relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-black text-[var(--accent)]">
                      {index + 1}
                    </span>
                    <span className="mt-4 block text-xs font-extrabold text-[var(--muted)]">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mt-28 grid scroll-mt-24 gap-16 lg:scroll-mt-28 lg:grid-cols-[0.92fr_1fr]"
        >
          <div>
            <p className="mb-6 text-xs font-extrabold uppercase tracking-normal text-[var(--accent)]">
              About label: add short section intro
            </p>
            <h2 className="max-w-[470px] text-5xl font-black leading-tight tracking-normal sm:text-6xl">
              Built for educators fighting AI
            </h2>
            <p className="mt-8 max-w-[570px] text-lg font-medium leading-8 text-[var(--muted)]">
              About description: explain what WriteCheck AI does, who it helps,
              and why handwritten essay checking matters.
            </p>
            <p className="mt-6 max-w-[570px] text-lg font-medium leading-8 text-[var(--muted)]">
              Audience description: describe the schools, teachers, reviewers,
              or academic users this product is designed for.
            </p>
            <a
              href="#features"
              className="mt-9 inline-flex h-12 items-center justify-center rounded-lg bg-[var(--accent)] px-6 text-base font-extrabold text-white transition hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]"
            >
              See our features
            </a>
          </div>

          <div id="features" className="grid scroll-mt-24 gap-6 sm:grid-cols-2 lg:scroll-mt-28">
            {features.map(({ title, copy, icon: Icon }) => (
              <article
                key={title}
                className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-7 shadow-[var(--shadow)]"
              >
                <span className="mb-8 grid h-11 w-11 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-3 text-base font-medium leading-7 text-[var(--muted)]">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
