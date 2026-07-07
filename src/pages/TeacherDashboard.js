import { useCallback, useEffect, useState } from "react";

import { supabase } from "../supabaseClient";
import {
  ASSIGNMENT_TABLE,
  CLASSROOM_TABLE,
  ClipboardIcon,
  MEMBER_TABLE,
  SUBMISSION_TABLE,
  DoorIcon,
  FileIcon,
  FileSearchIcon,
  Header,
  ImageIcon,
  PlusIcon,
  StatusMessage,
  UploadIcon,
  UsersIcon,
  buildClassCode,
  emptyAssignmentForm,
  emptyClassroomForm,
  formatDateTime,
  normalizeAssignment,
  normalizeClassroom,
  openSubmissionFile,
  teacherPages,
} from "./dashboard/shared";
import {
  ACCEPTED_CHECK_FILE_TYPES,
  analyzePlagiarismInput,
  formatFileSize,
  getFileKind,
  readTextFromFiles,
} from "./dashboard/plagiarismScan";

const uploadModes = [
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

export default function TeacherDashboard({ profile }) {
  const [activePage, setActivePage] =
    useState("upload");

  const [classrooms, setClassrooms] =
    useState([]);

  const [assignments, setAssignments] =
    useState([]);

  const [submissions, setSubmissions] =
    useState([]);

  const [selectedClassroomId, setSelectedClassroomId] =
    useState("");

  const [classroomForm, setClassroomForm] =
    useState(emptyClassroomForm);

  const [assignmentForm, setAssignmentForm] =
    useState(emptyAssignmentForm);

  const [uploadMode, setUploadMode] =
    useState("");

  const [manualCheckTitle, setManualCheckTitle] =
    useState("");

  const [manualCheckText, setManualCheckText] =
    useState("");

  const [manualCheckFiles, setManualCheckFiles] =
    useState([]);

  const [manualImagePreview, setManualImagePreview] =
    useState("");

  const [manualCheckResult, setManualCheckResult] =
    useState(null);

  const [manualCheckError, setManualCheckError] =
    useState("");

  const [isCreatingClassroom, setIsCreatingClassroom] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSavingClassroom, setIsSavingClassroom] =
    useState(false);

  const [isSavingAssignment, setIsSavingAssignment] =
    useState(false);

  const [isScanningManualCheck, setIsScanningManualCheck] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const selectedClassroom =
    classrooms.find((classroom) => classroom.id === selectedClassroomId) ??
    classrooms[0] ??
    {
      id: "",
      name: "No classroom yet",
      section: "Create a classroom to get started",
      subject: "",
      code: "------",
      students: 0,
      assignments: 0,
      submissions: 0,
      accent: "bg-emerald-700",
    };

  const loadTeacherData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data: classroomRows, error: classroomError } =
      await supabase
        .from(CLASSROOM_TABLE)
        .select("id, created_at, teacher_id, classroom_name, classroom_code, subject, section")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });

    if (classroomError) {
      setErrorMessage(classroomError.message);
      setIsLoading(false);
      return;
    }

    const classIds =
      (classroomRows ?? []).map((classroom) => classroom.id);

    let memberRows = [];
    let assignmentRows = [];
    let submissionRows = [];
    let studentRows = [];

    if (classIds.length > 0) {
      const { data: members } =
        await supabase
          .from(MEMBER_TABLE)
          .select("classroom_id")
          .in("classroom_id", classIds);

      memberRows =
        members ?? [];
    }

    const { data: assignmentsData, error: assignmentError } =
      await supabase
        .from(ASSIGNMENT_TABLE)
        .select("id, created_at, classroom_id, teacher_id, title, instructions, due_date")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });

    if (assignmentError) {
      setErrorMessage(assignmentError.message);
      setIsLoading(false);
      return;
    }

    assignmentRows =
      assignmentsData ?? [];

    const assignmentIds =
      assignmentRows.map((assignment) => assignment.id);

    if (assignmentIds.length > 0) {
      const { data: submissionsData, error: submissionError } =
        await supabase
          .from(SUBMISSION_TABLE)
          .select("id, created_at, assignment_id, classroom_id, student_id, essay_title, file_url, status")
          .in("assignment_id", assignmentIds)
          .order("created_at", { ascending: false });

      if (submissionError) {
        setErrorMessage(submissionError.message);
        setIsLoading(false);
        return;
      }

      submissionRows =
        submissionsData ?? [];

      const studentIds =
        [...new Set(submissionRows.map((submission) => submission.student_id).filter(Boolean))];

      if (studentIds.length > 0) {
        const { data: users } =
          await supabase
            .from("userTable")
            .select("id, full_name, email")
            .in("id", studentIds);

        studentRows =
          users ?? [];
      }
    }

    const memberCountByClass =
      memberRows.reduce((counts, member) => {
        counts[member.classroom_id] =
          (counts[member.classroom_id] ?? 0) + 1;
        return counts;
      }, {});

    const assignmentCountByClass =
      assignmentRows.reduce((counts, assignment) => {
        counts[assignment.classroom_id] =
          (counts[assignment.classroom_id] ?? 0) + 1;
        return counts;
      }, {});

    const submissionCountByClass =
      submissionRows.reduce((counts, submission) => {
        counts[submission.classroom_id] =
          (counts[submission.classroom_id] ?? 0) + 1;
        return counts;
      }, {});

    const nextClassrooms =
      (classroomRows ?? []).map((classroom, index) =>
        normalizeClassroom(classroom, index, {
          students: memberCountByClass[classroom.id] ?? 0,
          assignments: assignmentCountByClass[classroom.id] ?? 0,
          submissions: submissionCountByClass[classroom.id] ?? 0,
        })
      );

    const classroomsById =
      new Map(nextClassrooms.map((classroom) => [classroom.id, classroom]));

    const submissionCountByAssignment =
      submissionRows.reduce((counts, submission) => {
        counts[submission.assignment_id] =
          (counts[submission.assignment_id] ?? 0) + 1;
        return counts;
      }, {});

    const nextAssignments =
      assignmentRows.map((assignment) =>
        normalizeAssignment(assignment, classroomsById, {
          submissions: submissionCountByAssignment[assignment.id] ?? 0,
        })
      );

    const studentsById =
      new Map(
        studentRows.map((student) => [
          student.id,
          student.full_name || student.email || "Student",
        ])
      );

    const assignmentsById =
      new Map(nextAssignments.map((assignment) => [assignment.id, assignment]));

    const nextSubmissions =
      submissionRows.map((submission) => {
        const assignment =
          assignmentsById.get(submission.assignment_id);

        return {
          id: submission.id,
          createdAt: submission.created_at,
          assignmentId: submission.assignment_id,
          classroomId: submission.classroom_id,
          studentId: submission.student_id,
          studentName: studentsById.get(submission.student_id) || "Student",
          assignmentTitle: assignment?.title || "Assignment",
          classroomName: assignment?.classroomName || "Classroom",
          essayTitle: submission.essay_title || "Essay submission",
          fileUrl: submission.file_url,
          status: submission.status || "submitted",
        };
      });

    setClassrooms(nextClassrooms);
    setAssignments(nextAssignments);
    setSubmissions(nextSubmissions);
    setSelectedClassroomId((currentId) =>
      nextClassrooms.some((classroom) => classroom.id === currentId)
        ? currentId
        : nextClassrooms[0]?.id ?? ""
    );
    setAssignmentForm((currentForm) => ({
      ...currentForm,
      classroomId:
        nextClassrooms.some((classroom) => classroom.id === currentForm.classroomId)
          ? currentForm.classroomId
          : nextClassrooms[0]?.id ?? "",
    }));
    setIsLoading(false);
  }, [profile.id]);

  useEffect(() => {
    loadTeacherData();
  }, [loadTeacherData]);

  useEffect(() => {
    const imageFile =
      manualCheckFiles.find((file) => file.type?.startsWith("image/"));

    if (!imageFile) {
      setManualImagePreview("");
      return undefined;
    }

    const previewUrl =
      URL.createObjectURL(imageFile);

    setManualImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [manualCheckFiles]);

  const handleCreateClassroom = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingClassroom(true);

    const className =
      classroomForm.name.trim();

    const section =
      classroomForm.section.trim();

    const subject =
      classroomForm.subject.trim();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const classroomCode =
        buildClassCode(className);

      const { error } =
        await supabase
          .from(CLASSROOM_TABLE)
          .insert({
            teacher_id: profile.id,
            classroom_name: className,
            classroom_code: classroomCode,
            subject: subject || null,
            section,
          });

      if (error?.code === "23505") {
        continue;
      }

      if (error) {
        setErrorMessage(error.message);
        setIsSavingClassroom(false);
        return;
      }

      setClassroomForm(emptyClassroomForm);
      setIsCreatingClassroom(false);
      setSuccessMessage(`Class created. Code: ${classroomCode}`);
      setIsSavingClassroom(false);
      await loadTeacherData();
      return;
    }

    setErrorMessage("Could not generate a unique class code. Try again.");
    setIsSavingClassroom(false);
  };

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingAssignment(true);

    const classroomId =
      assignmentForm.classroomId || selectedClassroom.id;

    const dueDate =
      assignmentForm.dueDate
        ? new Date(assignmentForm.dueDate).toISOString()
        : null;

    const { error } =
      await supabase
        .from(ASSIGNMENT_TABLE)
        .insert({
          classroom_id: classroomId,
          teacher_id: profile.id,
          title: assignmentForm.title.trim(),
          instructions: assignmentForm.instructions.trim() || null,
          due_date: dueDate,
        });

    if (error) {
      setErrorMessage(error.message);
      setIsSavingAssignment(false);
      return;
    }

    setAssignmentForm({
      ...emptyAssignmentForm,
      classroomId,
    });
    setSuccessMessage("Assignment created.");
    setIsSavingAssignment(false);
    await loadTeacherData();
  };

  const handleManualCheckFiles = (event) => {
    const nextFiles =
      Array.from(event.target.files ?? []);

    setManualCheckFiles(nextFiles);
    setManualCheckResult(null);
    setManualCheckError("");

    if (nextFiles.length > 0 && uploadMode === "text") {
      setUploadMode("file");
    }
  };

  const handleRunManualCheck = async (event) => {
    event.preventDefault();
    setManualCheckError("");
    setManualCheckResult(null);

    if (!manualCheckText.trim() && manualCheckFiles.length === 0) {
      setManualCheckError("Add a picture, file, or pasted text before scanning.");
      return;
    }

    setIsScanningManualCheck(true);

    try {
      const fileText =
        await readTextFromFiles(manualCheckFiles);

      const combinedText =
        [manualCheckText, fileText.text]
          .map((value) => value.trim())
          .filter(Boolean)
          .join("\n\n");

      const result =
        analyzePlagiarismInput({
          text: combinedText,
          files: manualCheckFiles,
        });

      setManualCheckResult({
        ...result,
        title: manualCheckTitle.trim() || "Manual plagiarism check",
        extractedText: fileText.extractedText,
        extractedImages: fileText.extractedImages,
        readableFiles: fileText.readableFiles,
        unreadableFiles: fileText.unreadableFiles,
      });
    } catch (error) {
      setManualCheckError(error.message || "Could not scan the selected material.");
    } finally {
      setIsScanningManualCheck(false);
    }
  };

  const handleResetManualCheck = () => {
    setManualCheckTitle("");
    setManualCheckText("");
    setManualCheckFiles([]);
    setManualCheckResult(null);
    setManualCheckError("");
    setUploadMode("");
  };

  const manualResultBadgeClass =
    manualCheckResult?.tone === "red"
      ? "bg-red-50 text-red-700"
      : manualCheckResult?.tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  const manualResultRingClass =
    manualCheckResult?.tone === "red"
      ? "text-red-700 ring-red-100"
      : manualCheckResult?.tone === "amber"
        ? "text-amber-700 ring-amber-100"
        : "text-emerald-700 ring-emerald-100";

  return (
    <div className="min-h-screen bg-[#f4f3ef] text-gray-950">
      <Header
        workspace="Teacher workspace"
        pages={teacherPages}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main
        className={
          activePage === "upload"
            ? "mx-auto max-w-[1240px] px-6 py-8"
            : "mx-auto grid max-w-[1240px] gap-8 px-6 py-8 lg:grid-cols-[280px_1fr]"
        }
      >
        {activePage !== "upload" && (
        <aside className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setIsCreatingClassroom(true);
              setActivePage("classrooms");
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-800"
          >
            <PlusIcon className="h-4 w-4" />
            Create classroom
          </button>

          <button
            type="button"
            onClick={() => setActivePage("assignments")}
            disabled={classrooms.length === 0}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <FileSearchIcon className="h-4 w-4" />
            New assignment
          </button>

          <button
            type="button"
            onClick={() => setActivePage("upload")}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
          >
            <UploadIcon className="h-4 w-4" />
            Upload station
          </button>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-normal text-gray-500">
              Classrooms
            </p>

            <div className="space-y-1">
              {isLoading && (
                <p className="px-3 py-3 text-sm font-bold text-gray-500">
                  Loading classrooms...
                </p>
              )}

              {!isLoading && classrooms.length === 0 && (
                <p className="px-3 py-3 text-sm font-bold text-gray-500">
                  No classrooms yet.
                </p>
              )}

              {classrooms.map((classroom) => {
                const isActive =
                  classroom.id === selectedClassroomId;

                return (
                  <button
                    key={classroom.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassroomId(classroom.id);
                      setActivePage("classrooms");
                    }}
                    className={
                      isActive
                        ? "flex w-full items-center gap-3 rounded-lg bg-gray-100 px-3 py-3 text-left text-gray-950"
                        : "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                    }
                  >
                    <span className={`h-9 w-2 rounded-full ${classroom.accent}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">
                        {classroom.name}
                      </span>
                      <span className="block truncate text-xs font-bold text-gray-500">
                        {classroom.section}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
        )}

        <section className="space-y-8">
          <StatusMessage
            error={errorMessage}
            message={successMessage}
          />

          {activePage === "classrooms" && (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                    Classroom
                  </p>
                  <h2 className="mt-2 text-4xl font-black tracking-normal">
                    {selectedClassroom.name}
                  </h2>
                  <p className="mt-2 text-base font-semibold text-gray-500">
                    {[selectedClassroom.section, selectedClassroom.subject]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePage("assignments")}
                  disabled={classrooms.length === 0}
                  className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create assignment
                </button>
              </div>

              {isCreatingClassroom && (
                <form
                  onSubmit={handleCreateClassroom}
                  className="rounded-lg border border-gray-200 bg-white p-6"
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="text-sm font-extrabold text-gray-800">
                        Class name
                      </span>
                      <input
                        type="text"
                        value={classroomForm.name}
                        onChange={(event) =>
                          setClassroomForm((currentForm) => ({
                            ...currentForm,
                            name: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-extrabold text-gray-800">
                        Section
                      </span>
                      <input
                        type="text"
                        value={classroomForm.section}
                        onChange={(event) =>
                          setClassroomForm((currentForm) => ({
                            ...currentForm,
                            section: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-extrabold text-gray-800">
                        Subject
                      </span>
                      <input
                        type="text"
                        value={classroomForm.subject}
                        onChange={(event) =>
                          setClassroomForm((currentForm) => ({
                            ...currentForm,
                            subject: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        required
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingClassroom}
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      {isSavingClassroom ? "Creating..." : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingClassroom(false);
                        setClassroomForm(emptyClassroomForm);
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid gap-4 md:grid-cols-4">
                <article className="rounded-lg border border-gray-200 bg-white p-5">
                  <UsersIcon className="h-6 w-6 text-emerald-700" />
                  <p className="mt-5 text-3xl font-black">
                    {selectedClassroom.students}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-500">
                    Students
                  </p>
                </article>

                <article className="rounded-lg border border-gray-200 bg-white p-5">
                  <FileSearchIcon className="h-6 w-6 text-sky-700" />
                  <p className="mt-5 text-3xl font-black">
                    {selectedClassroom.assignments}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-500">
                    Assignments
                  </p>
                </article>

                <article className="rounded-lg border border-gray-200 bg-white p-5">
                  <UploadIcon className="h-6 w-6 text-amber-700" />
                  <p className="mt-5 text-3xl font-black">
                    {selectedClassroom.submissions}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-500">
                    Submissions
                  </p>
                </article>

                <article className="rounded-lg border border-gray-200 bg-white p-5">
                  <DoorIcon className="h-6 w-6 text-violet-700" />
                  <p className="mt-5 text-3xl font-black">
                    {selectedClassroom.code}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-500">
                    Class code
                  </p>
                </article>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {classrooms.map((classroom) => (
                  <article
                    key={classroom.id}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                  >
                    <div className={`${classroom.accent} h-24 p-5 text-white`}>
                      <h3 className="truncate text-xl font-black">
                        {classroom.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-white/80">
                        {classroom.section}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <strong className="block text-xl font-black">
                            {classroom.students}
                          </strong>
                          <span className="text-xs font-bold text-gray-500">
                            Students
                          </span>
                        </div>
                        <div>
                          <strong className="block text-xl font-black">
                            {classroom.assignments}
                          </strong>
                          <span className="text-xs font-bold text-gray-500">
                            Work
                          </span>
                        </div>
                        <div>
                          <strong className="block text-xl font-black">
                            {classroom.submissions}
                          </strong>
                          <span className="text-xs font-bold text-gray-500">
                            Turned in
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentForm((currentForm) => ({
                            ...currentForm,
                            classroomId: classroom.id,
                          }));
                          setActivePage("assignments");
                        }}
                        className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                      >
                        Add assignment
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {activePage === "assignments" && (
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <form
                onSubmit={handleCreateAssignment}
                className="h-fit rounded-lg border border-gray-200 bg-white p-6"
              >
                <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                  Assignment bin
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-normal">
                  Create assignment
                </h2>

                <label className="mt-6 block">
                  <span className="text-sm font-extrabold text-gray-800">
                    Classroom
                  </span>
                  <select
                    value={assignmentForm.classroomId}
                    onChange={(event) =>
                      setAssignmentForm((currentForm) => ({
                        ...currentForm,
                        classroomId: event.target.value,
                      }))
                    }
                    disabled={classrooms.length === 0}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    required
                  >
                    {classrooms.length === 0 && (
                      <option value="">
                        Create a classroom first
                      </option>
                    )}
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-extrabold text-gray-800">
                    Title
                  </span>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(event) =>
                      setAssignmentForm((currentForm) => ({
                        ...currentForm,
                        title: event.target.value,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-extrabold text-gray-800">
                    Instructions
                  </span>
                  <textarea
                    value={assignmentForm.instructions}
                    onChange={(event) =>
                      setAssignmentForm((currentForm) => ({
                        ...currentForm,
                        instructions: event.target.value,
                      }))
                    }
                    rows="5"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-extrabold text-gray-800">
                    Due date
                  </span>
                  <input
                    type="datetime-local"
                    value={assignmentForm.dueDate}
                    onChange={(event) =>
                      setAssignmentForm((currentForm) => ({
                        ...currentForm,
                        dueDate: event.target.value,
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSavingAssignment || classrooms.length === 0}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-base font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  <PlusIcon className="h-5 w-5" />
                  {isSavingAssignment ? "Creating..." : "Create assignment"}
                </button>
              </form>

              <div>
                <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                  Posted work
                </p>
                <h2 className="mt-2 text-4xl font-black tracking-normal">
                  Assignments
                </h2>

                <div className="mt-6 space-y-4">
                  {assignments.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <p className="text-sm font-bold text-gray-500">
                        No assignments yet.
                      </p>
                    </div>
                  )}

                  {assignments.map((assignment) => (
                    <article
                      key={assignment.id}
                      className="rounded-lg border border-gray-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-black text-gray-950">
                            {assignment.title}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-gray-500">
                            {assignment.classroomName} | {formatDateTime(assignment.dueDate)}
                          </p>
                        </div>
                        <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                          {assignment.submissions} submitted
                        </span>
                      </div>

                      {assignment.instructions && (
                        <p className="mt-4 text-sm font-semibold leading-6 text-gray-600">
                          {assignment.instructions}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === "upload" && (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                    Manual check
                  </p>
                  <h2 className="mt-2 text-4xl font-black tracking-normal">
                    Upload station
                  </h2>
                  <p className="mt-2 max-w-[680px] text-base font-semibold leading-7 text-gray-500">
                    Review student work from a photo, document, readable file, or pasted text.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetManualCheck}
                  className="inline-flex h-11 w-fit items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                >
                  Clear station
                </button>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:min-h-[720px]">
                <form
                  onSubmit={handleRunManualCheck}
                  className="flex min-h-[560px] flex-col rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6"
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    {uploadModes.map(({ id, label, icon: Icon }) => {
                      const isActive =
                        uploadMode === id;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setUploadMode(id);
                            setManualCheckResult(null);
                            setManualCheckError("");
                          }}
                          className={
                            isActive
                              ? "flex min-h-[104px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-emerald-700 bg-white px-4 text-sm font-extrabold text-emerald-800 shadow-sm"
                              : "flex min-h-[104px] flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 text-sm font-extrabold text-gray-500 transition hover:border-emerald-300 hover:text-gray-950"
                          }
                        >
                          <span className={isActive ? "grid h-11 w-11 place-items-center rounded-lg bg-emerald-100 text-emerald-700" : "grid h-11 w-11 place-items-center rounded-lg bg-gray-100 text-gray-500"}>
                            <Icon className="h-5 w-5" />
                          </span>
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-6 block">
                    <span className="text-sm font-extrabold text-gray-800">
                      Check title
                    </span>
                    <input
                      type="text"
                      value={manualCheckTitle}
                      onChange={(event) => setManualCheckTitle(event.target.value)}
                      placeholder="Example: Grade 10 essay draft"
                      className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="mt-5 flex flex-1 flex-col">
                    {!uploadMode && (
                      <div className="grid flex-1 min-h-[320px] place-items-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 text-center">
                        <div>
                          <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                            <UploadIcon className="h-8 w-8" />
                          </span>
                          <h3 className="mt-5 text-xl font-black text-gray-950">
                            Choose a submission type first
                          </h3>
                          <p className="mt-2 max-w-[430px] text-sm font-semibold leading-6 text-gray-500">
                            Pick picture, file, or pasted text above to open the right submission box.
                          </p>
                        </div>
                      </div>
                    )}

                    {(uploadMode === "picture" || uploadMode === "file") && (
                      <>
                        <label className="flex flex-1 min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 text-center transition hover:border-emerald-600 hover:bg-emerald-50">
                          {manualImagePreview ? (
                            <img
                              src={manualImagePreview}
                              alt="Manual check preview"
                              className="max-h-[320px] w-full rounded-lg object-contain"
                            />
                          ) : (
                            <>
                              <span className="grid h-20 w-20 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                                {uploadMode === "picture" ? (
                                  <ImageIcon className="h-10 w-10" />
                                ) : (
                                  <UploadIcon className="h-10 w-10" />
                                )}
                              </span>
                              <span className="mt-6 text-2xl font-black text-gray-950">
                                {uploadMode === "picture" ? "Upload a picture" : "Upload a file"}
                              </span>
                              <span className="mt-2 max-w-[520px] text-sm font-semibold leading-6 text-gray-500">
                                {uploadMode === "picture"
                                  ? "Select a PNG, JPG, JPEG, or WEBP image of the student work."
                                  : "Select a PDF, DOCX, TXT, MD, CSV, JSON, or other supported classroom file."}
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept={
                              uploadMode === "picture"
                                ? "image/png,image/jpeg,image/jpg,image/webp"
                                : ACCEPTED_CHECK_FILE_TYPES
                            }
                            multiple
                            onChange={handleManualCheckFiles}
                            className="sr-only"
                          />
                        </label>

                        {manualCheckFiles.length > 0 && (
                          <div className="mt-5 rounded-lg border border-gray-200 bg-white">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-gray-100 px-4 py-3 text-xs font-extrabold uppercase tracking-normal text-gray-500">
                              <span>File</span>
                              <span>Type</span>
                              <span>Size</span>
                            </div>

                            {manualCheckFiles.map((file) => (
                              <div
                                key={`${file.name}-${file.size}-${file.lastModified}`}
                                className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0"
                              >
                                <span className="min-w-0 truncate font-extrabold text-gray-950">
                                  {file.name}
                                </span>
                                <span className="font-bold text-gray-500">
                                  {getFileKind(file)}
                                </span>
                                <span className="font-bold text-gray-500">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {uploadMode === "text" && (
                      <label className="flex flex-1 flex-col">
                        <span className="text-sm font-extrabold text-gray-800">
                          Paste text
                        </span>
                        <textarea
                          value={manualCheckText}
                          onChange={(event) => {
                            setManualCheckText(event.target.value);
                            setManualCheckResult(null);
                          }}
                          placeholder="Paste essay text, copied paragraphs, or OCR output here."
                          className="mt-2 flex-1 min-h-[360px] w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-sm font-semibold leading-6 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        />
                      </label>
                    )}
                  </div>

                  {manualCheckError && (
                    <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {manualCheckError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isScanningManualCheck || !uploadMode}
                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-base font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    <FileSearchIcon className="h-5 w-5" />
                    {isScanningManualCheck ? "Scanning..." : "Scan for plagiarism"}
                  </button>
                </form>

                <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                        Detection result
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        {manualCheckResult?.title || "Ready to scan"}
                      </h3>
                    </div>

                    {manualCheckResult && (
                      <span className={`rounded-lg px-3 py-2 text-sm font-black ${manualResultBadgeClass}`}>
                        {manualCheckResult.label}
                      </span>
                    )}
                  </div>

                  {manualCheckResult ? (
                    <>
                      <div className="mt-7 grid gap-4 sm:grid-cols-[160px_1fr]">
                        <div className={`grid aspect-square place-items-center rounded-lg bg-white text-center ring-8 ${manualResultRingClass}`}>
                          <div>
                            <strong className="block text-5xl font-black">
                              {manualCheckResult.score}
                            </strong>
                            <span className="mt-1 block text-xs font-extrabold uppercase tracking-normal text-gray-500">
                              Risk score
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-2xl font-black text-gray-950">
                              {manualCheckResult.wordCount}
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-500">
                              Words scanned
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-2xl font-black text-gray-950">
                              {manualCheckResult.sourceSignals}
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-500">
                              Source markers
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-2xl font-black text-gray-950">
                              {manualCheckResult.repeatedPhraseCount}
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-500">
                              Repeated patterns
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-2xl font-black text-gray-950">
                              {manualCheckResult.unreadableFiles.length}
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-500">
                              OCR needed
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="mt-6 text-sm font-semibold leading-6 text-gray-600">
                        {manualCheckResult.summary}
                      </p>

                      {manualCheckResult.extractedText && (
                        <div className="mt-6">
                          <p className="text-sm font-extrabold text-gray-800">
                            Extracted text
                          </p>
                          <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold leading-6 text-gray-700">
                            {manualCheckResult.extractedText}
                          </pre>
                        </div>
                      )}

                      <div className="mt-6">
                        <p className="text-sm font-extrabold text-gray-800">
                          Review signals
                        </p>
                        <div className="mt-3 space-y-2">
                          {manualCheckResult.flags.map((flag) => (
                            <p
                              key={flag}
                              className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                            >
                              {flag}
                            </p>
                          ))}
                        </div>
                      </div>

                      {manualCheckResult.repeatedPhrases.length > 0 && (
                        <div className="mt-6">
                          <p className="text-sm font-extrabold text-gray-800">
                            Repeated phrases
                          </p>
                          <div className="mt-3 space-y-2">
                            {manualCheckResult.repeatedPhrases.map((item) => (
                              <p
                                key={item.phrase}
                                className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-semibold leading-6 text-gray-600"
                              >
                                "{item.phrase}" appears {item.count} times
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-8 grid min-h-[220px] place-items-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-6 text-center">
                      <div>
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                          <FileSearchIcon className="h-8 w-8" />
                        </span>
                        <h3 className="mt-5 text-xl font-black text-gray-950">
                          No scan result yet
                        </h3>
                        <p className="mt-2 max-w-[420px] text-sm font-semibold leading-6 text-gray-500">
                          Add student work above, then run a plagiarism scan.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {activePage === "submissions" && (
            <div>
              <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                Student work
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-normal">
                Submissions
              </h2>

              <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr] gap-4 border-b border-gray-200 px-5 py-3 text-xs font-extrabold uppercase tracking-normal text-gray-500">
                  <span>Student</span>
                  <span>Assignment</span>
                  <span>Essay</span>
                  <span>File</span>
                </div>

                {submissions.length === 0 && (
                  <p className="px-5 py-5 text-sm font-bold text-gray-500">
                    No submissions yet.
                  </p>
                )}

                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="grid grid-cols-[1fr_1fr_1fr_0.8fr] gap-4 border-b border-gray-100 px-5 py-4 text-sm last:border-b-0"
                  >
                    <span className="font-extrabold text-gray-950">
                      {submission.studentName}
                    </span>
                    <span className="font-semibold text-gray-600">
                      {submission.assignmentTitle}
                    </span>
                    <span className="font-semibold text-gray-600">
                      {submission.essayTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSubmissionFile(submission.fileUrl, setErrorMessage)}
                      className="w-fit rounded-lg border border-gray-200 px-3 py-2 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}



