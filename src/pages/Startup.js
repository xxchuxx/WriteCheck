import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ACCEPTED_CHECK_FILE_TYPES,
  analyzePlagiarismInput,
  formatFileSize,
  getFileKind,
  readTextFromFiles,
} from "./dashboard/plagiarismScan";

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

function ClipboardIcon({ className = "h-5 w-5" }) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
      <path d="M9 10h1" />
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
  ["3", "Intake options"],
  ["Live", "Paste-text scan"],
  ["1", "Teacher review station"],
];

const steps = ["Upload", "Detect", "Transcribe", "Check"];

const demoModes = [
  {
    id: "picture",
    label: "Picture",
    icon: ImageIcon,
  },
  {
    id: "file",
    label: "File",
    icon: FileIcon,
  },
  {
    id: "text",
    label: "Paste",
    icon: ClipboardIcon,
  },
];

const features = [
  {
    title: "Text region detection",
    copy:
      "Find essay regions in uploaded pages before handwriting is sent through OCR.",
    icon: LayoutIcon,
  },
  {
    title: "Handwriting OCR",
    copy:
      "Convert clean handwritten scans into text that teachers can review and compare.",
    icon: LayersIcon,
  },
  {
    title: "Source matching",
    copy:
      "Flag repeated phrases, missing source markers, and passages that need closer checking.",
    icon: SearchIcon,
  },
  {
    title: "PDF reports",
    copy:
      "Keep review signals, uploaded evidence, and teacher notes together for follow-up.",
    icon: FileIcon,
  },
];

export default function Startup() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [activeSection, setActiveSection] = useState("home");
  const [demoMode, setDemoMode] = useState("picture");
  const [demoFiles, setDemoFiles] = useState([]);
  const [demoText, setDemoText] = useState("");
  const [demoPreview, setDemoPreview] = useState("");
  const [demoResult, setDemoResult] = useState(null);
  const [demoError, setDemoError] = useState("");
  const [isDemoScanning, setIsDemoScanning] = useState(false);

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

  useEffect(() => {
    const imageFile =
      demoFiles.find((file) => file.type?.startsWith("image/"));

    if (!imageFile) {
      setDemoPreview("");
      return undefined;
    }

    const previewUrl =
      URL.createObjectURL(imageFile);

    setDemoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [demoFiles]);

  const handleDemoFiles = (event) => {
    const nextFiles =
      Array.from(event.target.files ?? []);

    setDemoFiles(nextFiles);
    setDemoResult(null);
    setDemoError("");

    if (nextFiles.length > 0 && demoMode === "text") {
      setDemoMode("file");
    }
  };

  const handleDemoScan = async (event) => {
    event.preventDefault();
    setDemoError("");
    setDemoResult(null);

    if (!demoText.trim() && demoFiles.length === 0) {
      setDemoError("Add a picture, file, or pasted text to scan.");
      return;
    }

    setIsDemoScanning(true);

    try {
      const fileText =
        await readTextFromFiles(demoFiles);

      const combinedText =
        [demoText, fileText.text]
          .map((value) => value.trim())
          .filter(Boolean)
          .join("\n\n");

      setDemoResult({
        ...analyzePlagiarismInput({
          text: combinedText,
          files: demoFiles,
        }),
        extractedText: fileText.extractedText,
        extractedImages: fileText.extractedImages,
        readableFiles: fileText.readableFiles,
        unreadableFiles: fileText.unreadableFiles,
      });
    } catch (error) {
      setDemoError(error.message || "Could not scan the selected material.");
    } finally {
      setIsDemoScanning(false);
    }
  };

  const handleUseSampleText = () => {
    setDemoMode("text");
    setDemoText(
      "Climate change affects communities in many ways. Climate change affects communities in many ways because rising heat changes food, water, and health. Students should explain where facts came from and include clear source markers when borrowed ideas are used."
    );
    setDemoResult(null);
    setDemoError("");
  };

  const getNavLinkClass = (sectionId) =>
    activeSection === sectionId
      ? "text-[var(--page-text)] transition"
      : "transition hover:text-[var(--page-text)]";

  const demoResultBadgeClass =
    demoResult?.tone === "red"
      ? "bg-red-50 text-red-700"
      : demoResult?.tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

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
            aria-label="WriteCheck home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent)] text-white">
              <ImageIcon className="h-5 w-5" />
            </span>
            <span>WriteCheck</span>
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
              Teacher-first plagiarism review
            </p>

            <h1 className="max-w-[720px] text-balance text-4xl font-black leading-[1.08] tracking-normal sm:text-5xl lg:text-6xl xl:text-[4.75rem]">
              Detect plagiarism in handwritten essays
            </h1>

            <p className="mt-8 max-w-[510px] text-lg font-medium leading-8 text-[var(--muted)] sm:text-xl">
              Upload essay photos, review document files, or paste copied text into one station built for classroom plagiarism checks.
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

          <form
            onSubmit={handleDemoScan}
            className="rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]"
          >
            <div className="flex min-h-14 flex-wrap items-center gap-3 border-b border-[var(--border-soft)] px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5b57]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2f]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-sm font-bold text-[var(--muted)] sm:text-base">
                upload-station
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-2 rounded-lg bg-[var(--panel-soft)] p-2 sm:grid-cols-3">
                {demoModes.map(({ id, label, icon: Icon }) => {
                  const isActive =
                    demoMode === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDemoMode(id)}
                      className={
                        isActive
                          ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--panel)] px-3 text-sm font-extrabold text-[var(--page-text)] shadow-sm"
                          : "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-extrabold text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--page-text)]"
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-5 flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--panel)] px-5 text-center transition hover:border-[var(--accent)]">
                {demoPreview ? (
                  <img
                    src={demoPreview}
                    alt="Essay upload preview"
                    className="max-h-[170px] w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <span className="mb-4 grid h-14 w-14 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                      <UploadIcon className="h-7 w-7" />
                    </span>
                    <span className="text-base font-extrabold text-[var(--page-text)]">
                      Upload picture or file
                    </span>
                    <span className="mt-2 max-w-[330px] text-sm font-semibold leading-6 text-[var(--muted)]">
                      Images, PDFs, Word documents, and readable text files
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept={
                    demoMode === "picture"
                      ? "image/png,image/jpeg,image/jpg,image/webp"
                      : ACCEPTED_CHECK_FILE_TYPES
                  }
                  multiple
                  onChange={handleDemoFiles}
                  className="sr-only"
                />
              </label>

              {demoFiles.length > 0 && (
                <div className="mt-4 rounded-lg border border-[var(--border-soft)]">
                  {demoFiles.slice(0, 2).map((file) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--border-soft)] px-3 py-2 text-sm last:border-b-0"
                    >
                      <span className="min-w-0 truncate font-bold text-[var(--page-text)]">
                        {file.name}
                      </span>
                      <span className="font-bold text-[var(--muted)]">
                        {getFileKind(file)} | {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <label className="mt-4 block">
                <span className="text-sm font-extrabold text-[var(--page-text)]">
                  Pasted text
                </span>
                <textarea
                  value={demoText}
                  onChange={(event) => {
                    setDemoText(event.target.value);
                    setDemoResult(null);
                    if (event.target.value && demoMode !== "text") {
                      setDemoMode("text");
                    }
                  }}
                  rows="4"
                  placeholder="Paste essay text or OCR output."
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-sm font-semibold leading-6 text-[var(--page-text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </label>

              {demoError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {demoError}
                </p>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="submit"
                  disabled={isDemoScanning}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SearchIcon className="h-4 w-4" />
                  {isDemoScanning ? "Scanning..." : "Scan demo"}
                </button>

                <button
                  type="button"
                  onClick={handleUseSampleText}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] px-5 text-sm font-extrabold text-[var(--page-text)] transition hover:bg-[var(--panel)]"
                >
                  Use sample
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-[var(--border-soft)] bg-[var(--panel-soft)] p-4">
                {demoResult ? (
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-3xl font-black">
                          {demoResult.score}
                        </p>
                        <p className="text-xs font-extrabold uppercase tracking-normal text-[var(--muted)]">
                          Risk score
                        </p>
                      </div>
                      <span className={`rounded-lg px-3 py-2 text-sm font-black ${demoResultBadgeClass}`}>
                        {demoResult.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <strong className="block text-xl font-black">
                          {demoResult.wordCount}
                        </strong>
                        <span className="text-xs font-bold text-[var(--muted)]">
                          Words
                        </span>
                      </div>
                      <div>
                        <strong className="block text-xl font-black">
                          {demoResult.sourceSignals}
                        </strong>
                        <span className="text-xs font-bold text-[var(--muted)]">
                          Sources
                        </span>
                      </div>
                      <div>
                        <strong className="block text-xl font-black">
                          {demoResult.unreadableFiles.length}
                        </strong>
                        <span className="text-xs font-bold text-[var(--muted)]">
                          OCR
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-6 text-[var(--muted)]">
                      {demoResult.flags[0]}
                    </p>

                    {demoResult.extractedText && (
                      <div className="mt-4">
                        <p className="text-xs font-extrabold uppercase tracking-normal text-[var(--muted)]">
                          Extracted text
                        </p>
                        <pre className="mt-2 max-h-[180px] overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-sm font-semibold leading-6 text-[var(--page-text)]">
                          {demoResult.extractedText}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 items-start gap-4">
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
                )}
              </div>
            </div>
          </form>
        </section>

        <section
          id="about"
          className="mt-28 grid scroll-mt-24 gap-16 lg:scroll-mt-28 lg:grid-cols-[0.92fr_1fr]"
        >
          <div>
            <p className="mb-6 text-xs font-extrabold uppercase tracking-normal text-[var(--accent)]">
              Built for classroom review
            </p>
            <h2 className="max-w-[470px] text-5xl font-black leading-tight tracking-normal sm:text-6xl">
              Built for educators checking original work
            </h2>
            <p className="mt-8 max-w-[570px] text-lg font-medium leading-8 text-[var(--muted)]">
              WriteCheck gives teachers one place to collect essay scans, pasted text, and classroom submissions for plagiarism review.
            </p>
            <p className="mt-6 max-w-[570px] text-lg font-medium leading-8 text-[var(--muted)]">
              It is designed for schools that still use handwritten drafts, printed work, and mixed digital submissions in the same class.
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
