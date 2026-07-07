import { supabase } from "../../supabaseClient";

export const CLASSROOM_TABLE = "classroomTable";
export const MEMBER_TABLE = "classroomMembers";
export const ASSIGNMENT_TABLE = "assignmentTable";
export const SUBMISSION_TABLE = "submissionTable";
export const ESSAY_BUCKET = "essay-submissions";

export function PlusIcon({ className = "h-5 w-5" }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function UploadIcon({ className = "h-5 w-5" }) {
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

export function ImageIcon({ className = "h-5 w-5" }) {
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

export function UsersIcon({ className = "h-5 w-5" }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function DoorIcon({ className = "h-5 w-5" }) {
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
      <path d="M4 21V5a2 2 0 0 1 2-2h10v18" />
      <path d="M16 3h2a2 2 0 0 1 2 2v16" />
      <path d="M12 12h.01" />
      <path d="M2 21h20" />
    </svg>
  );
}

export function FileSearchIcon({ className = "h-5 w-5" }) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7" />
      <path d="M14 2v6h6" />
      <path d="M10 13H8" />
      <path d="M10 17H8" />
      <circle cx="17" cy="17" r="3" />
      <path d="m21 21-1.9-1.9" />
    </svg>
  );
}

export function FileIcon({ className = "h-5 w-5" }) {
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

export function ClipboardIcon({ className = "h-5 w-5" }) {
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

function LogOutIcon({ className = "h-5 w-5" }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export const teacherPages = [
  {
    id: "upload",
    label: "Upload Station",
  },
  {
    id: "classrooms",
    label: "Classrooms",
  },
  {
    id: "assignments",
    label: "Assignments",
  },
  {
    id: "submissions",
    label: "Submissions",
  },
];

export const studentPages = [
  {
    id: "classrooms",
    label: "Classrooms",
  },
  {
    id: "assignments",
    label: "Assignments",
  },
  {
    id: "submissions",
    label: "Submissions",
  },
];

const classroomAccentClasses = [
  "bg-emerald-700",
  "bg-sky-700",
  "bg-violet-700",
  "bg-amber-700",
];

export const emptyClassroomForm = {
  name: "",
  section: "",
  subject: "",
};

export const emptyAssignmentForm = {
  classroomId: "",
  title: "",
  instructions: "",
  dueDate: "",
};

export const emptySubmissionForm = {
  assignmentId: "",
  essayTitle: "",
};

export function buildClassCode(name) {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = cleanName.slice(0, 4) || "CLAS";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}${suffix}`;
}

export function formatDateTime(value) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function normalizeClassroom(row, index = 0, extra = {}) {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    name: row.classroom_name || "Untitled classroom",
    section: row.section || "No section",
    subject: row.subject || "No subject",
    code: row.classroom_code,
    students: extra.students ?? 0,
    assignments: extra.assignments ?? 0,
    submissions: extra.submissions ?? 0,
    teacher: extra.teacher || "Teacher",
    accent: classroomAccentClasses[index % classroomAccentClasses.length],
  };
}

export function normalizeAssignment(row, classroomsById = new Map(), extra = {}) {
  const classroom =
    classroomsById.get(row.classroom_id);

  return {
    id: row.id,
    classroomId: row.classroom_id,
    teacherId: row.teacher_id,
    title: row.title || "Untitled assignment",
    instructions: row.instructions || "",
    dueDate: row.due_date,
    createdAt: row.created_at,
    classroomName: classroom?.name || "Classroom",
    classroomSection: classroom?.section || "",
    submissions: extra.submissions ?? 0,
    submitted: extra.submitted ?? false,
    submission: extra.submission ?? null,
  };
}

export async function openSubmissionFile(filePath, onError) {
  if (!filePath) {
    return;
  }

  if (/^https?:\/\//i.test(filePath)) {
    window.open(filePath, "_blank", "noopener,noreferrer");
    return;
  }

  const { data, error } =
    await supabase
      .storage
      .from(ESSAY_BUCKET)
      .createSignedUrl(filePath, 60);

  if (error) {
    onError(error.message);
    return;
  }

  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

export function StatusMessage({ error, message }) {
  return (
    <>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </p>
      )}
    </>
  );
}

function PageNav({ pages, activePage, onChange, label }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-2"
      aria-label={label}
    >
      {pages.map((page) => {
        const isActive =
          page.id === activePage;

        return (
          <button
            key={page.id}
            type="button"
            onClick={() => onChange(page.id)}
            className={
              isActive
                ? "rounded-lg px-4 py-2 text-sm font-extrabold text-gray-950 transition"
                : "rounded-lg px-4 py-2 text-sm font-extrabold text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            }
            aria-current={isActive ? "page" : undefined}
          >
            {page.label}
          </button>
        );
      })}
    </nav>
  );
}

export function Header({ workspace, pages, activePage, onPageChange }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-normal text-emerald-700">
            {workspace}
          </p>
          <h1 className="text-2xl font-black">
            WriteCheck
          </h1>
        </div>

        <PageNav
          pages={pages}
          activePage={activePage}
          onChange={onPageChange}
          label={`${workspace} pages`}
        />

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
        >
          <LogOutIcon className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}




