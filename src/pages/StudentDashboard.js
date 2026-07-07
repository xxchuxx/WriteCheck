import { useCallback, useEffect, useState } from "react";

import { supabase } from "../supabaseClient";
import {
  ASSIGNMENT_TABLE,
  CLASSROOM_TABLE,
  ClipboardIcon,
  ESSAY_BUCKET,
  FileIcon,
  MEMBER_TABLE,
  SUBMISSION_TABLE,
  Header,
  ImageIcon,
  PlusIcon,
  StatusMessage,
  UploadIcon,
  formatDateTime,
  normalizeAssignment,
  normalizeClassroom,
  openSubmissionFile,
  studentPages,
} from "./dashboard/shared";
import {
  ACCEPTED_CHECK_FILE_TYPES,
  formatFileSize,
  getFileKind,
} from "./dashboard/plagiarismScan";

const submissionModes = [
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

const emptySubmissionDraft = {
  assignmentId: "",
  essayTitle: "",
  mode: "",
  text: "",
};

function sanitizeFileName(value) {
  const cleanValue =
    value.trim().replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

  return cleanValue || "essay-submission";
}

export default function StudentDashboard({ profile }) {
  const [activePage, setActivePage] =
    useState("classrooms");

  const [classrooms, setClassrooms] =
    useState([]);

  const [assignments, setAssignments] =
    useState([]);

  const [submissions, setSubmissions] =
    useState([]);

  const [joinCode, setJoinCode] =
    useState("");

  const [selectedClassroomId, setSelectedClassroomId] =
    useState("");

  const [submissionDraft, setSubmissionDraft] =
    useState(emptySubmissionDraft);

  const [submissionFile, setSubmissionFile] =
    useState(null);

  const [filePreview, setFilePreview] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isJoiningClassroom, setIsJoiningClassroom] =
    useState(false);

  const [isSubmittingEssay, setIsSubmittingEssay] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const selectedAssignment =
    assignments.find((assignment) => assignment.id === submissionDraft.assignmentId) ??
    null;

  const selectedClassroom =
    classrooms.find((classroom) => classroom.id === selectedClassroomId) ??
    null;

  const visibleAssignments =
    selectedClassroomId
      ? assignments.filter((assignment) => assignment.classroomId === selectedClassroomId)
      : assignments;

  const loadStudentData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data: membershipRows, error: membershipError } =
      await supabase
        .from(MEMBER_TABLE)
        .select("id, classroom_id, joined_at")
        .eq("student_id", profile.id)
        .order("joined_at", { ascending: false });

    if (membershipError) {
      setErrorMessage(membershipError.message);
      setIsLoading(false);
      return;
    }

    const classroomIds =
      [...new Set((membershipRows ?? []).map((membership) => membership.classroom_id))];

    if (classroomIds.length === 0) {
      setClassrooms([]);
      setAssignments([]);
      setSubmissions([]);
      setSelectedClassroomId("");
      setSubmissionDraft(emptySubmissionDraft);
      setSubmissionFile(null);
      setIsLoading(false);
      return;
    }

    const { data: classroomRows, error: classroomError } =
      await supabase
        .from(CLASSROOM_TABLE)
        .select("id, created_at, teacher_id, classroom_name, classroom_code, subject, section")
        .in("id", classroomIds);

    if (classroomError) {
      setErrorMessage(classroomError.message);
      setIsLoading(false);
      return;
    }

    const { data: assignmentRows, error: assignmentError } =
      await supabase
        .from(ASSIGNMENT_TABLE)
        .select("id, created_at, classroom_id, teacher_id, title, instructions, due_date")
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false });

    if (assignmentError) {
      setErrorMessage(assignmentError.message);
      setIsLoading(false);
      return;
    }

    const assignmentIds =
      (assignmentRows ?? []).map((assignment) => assignment.id);

    let submissionRows = [];

    if (assignmentIds.length > 0) {
      const { data: submissionsData, error: submissionError } =
        await supabase
          .from(SUBMISSION_TABLE)
          .select("id, created_at, assignment_id, classroom_id, student_id, essay_title, file_url, status")
          .eq("student_id", profile.id)
          .in("assignment_id", assignmentIds)
          .order("created_at", { ascending: false });

      if (submissionError) {
        setErrorMessage(submissionError.message);
        setIsLoading(false);
        return;
      }

      submissionRows =
        submissionsData ?? [];
    }

    const teacherIds =
      [...new Set((classroomRows ?? []).map((classroom) => classroom.teacher_id).filter(Boolean))];

    let teacherRows = [];

    if (teacherIds.length > 0) {
      const { data: teachers } =
        await supabase
          .from("userTable")
          .select("id, full_name, email")
          .in("id", teacherIds);

      teacherRows =
        teachers ?? [];
    }

    const teachersById =
      new Map(
        teacherRows.map((teacher) => [
          teacher.id,
          teacher.full_name || teacher.email || "Teacher",
        ])
      );

    const assignmentCountByClass =
      (assignmentRows ?? []).reduce((counts, assignment) => {
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
          assignments: assignmentCountByClass[classroom.id] ?? 0,
          submissions: submissionCountByClass[classroom.id] ?? 0,
          teacher: teachersById.get(classroom.teacher_id) || "Teacher",
        })
      );

    const classroomsById =
      new Map(nextClassrooms.map((classroom) => [classroom.id, classroom]));

    const submissionsByAssignment =
      new Map(submissionRows.map((submission) => [submission.assignment_id, submission]));

    const nextAssignments =
      (assignmentRows ?? []).map((assignment) =>
        normalizeAssignment(assignment, classroomsById, {
          submitted: submissionsByAssignment.has(assignment.id),
          submission: submissionsByAssignment.get(assignment.id) ?? null,
        })
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
    setSubmissionDraft((currentDraft) => ({
      ...currentDraft,
      assignmentId:
        nextAssignments.some(
          (assignment) =>
            assignment.id === currentDraft.assignmentId && !assignment.submitted
        )
          ? currentDraft.assignmentId
          : "",
    }));
    setIsLoading(false);
  }, [profile.id]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  useEffect(() => {
    if (!submissionFile || !submissionFile.type?.startsWith("image/")) {
      setFilePreview("");
      return undefined;
    }

    const previewUrl =
      URL.createObjectURL(submissionFile);

    setFilePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [submissionFile]);

  const handleJoinClassroom = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanCode =
      joinCode.trim().toUpperCase();

    if (!cleanCode) {
      return;
    }

    const alreadyJoined =
      classrooms.some((classroom) => classroom.code === cleanCode);

    if (alreadyJoined) {
      setSuccessMessage("You are already in that classroom.");
      setJoinCode("");
      return;
    }

    setIsJoiningClassroom(true);

    const { data: classroom, error: classroomError } =
      await supabase
        .from(CLASSROOM_TABLE)
        .select("id, classroom_name, classroom_code")
        .eq("classroom_code", cleanCode)
        .maybeSingle();

    if (classroomError) {
      setErrorMessage(classroomError.message);
      setIsJoiningClassroom(false);
      return;
    }

    if (!classroom) {
      setErrorMessage("No classroom found with that code.");
      setIsJoiningClassroom(false);
      return;
    }

    const { error: membershipError } =
      await supabase
        .from(MEMBER_TABLE)
        .insert({
          classroom_id: classroom.id,
          student_id: profile.id,
        });

    if (membershipError?.code === "23505") {
      setSuccessMessage("You are already in that classroom.");
      setJoinCode("");
      setIsJoiningClassroom(false);
      await loadStudentData();
      return;
    }

    if (membershipError) {
      setErrorMessage(membershipError.message);
      setIsJoiningClassroom(false);
      return;
    }

    setJoinCode("");
    setSuccessMessage(`Joined ${classroom.classroom_name}.`);
    setIsJoiningClassroom(false);
    await loadStudentData();
  };

  const handleViewClassroomAssignments = (classroomId) => {
    setSelectedClassroomId(classroomId);
    setSubmissionDraft(emptySubmissionDraft);
    setSubmissionFile(null);
    setActivePage("assignments");
  };

  const handleOpenSubmissionDraft = (assignment) => {
    setErrorMessage("");
    setSuccessMessage("");
    setSubmissionFile(null);
    setSubmissionDraft({
      ...emptySubmissionDraft,
      assignmentId: assignment.id,
      essayTitle: assignment.title,
    });
  };

  const handleSubmissionModeChange = (mode) => {
    setSubmissionFile(null);
    setSubmissionDraft((currentDraft) => ({
      ...currentDraft,
      mode,
      text: mode === "text" ? currentDraft.text : "",
    }));
  };

  const handleSubmitAssignment = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedAssignment) {
      return;
    }

    if (selectedAssignment.submitted) {
      setErrorMessage("You already submitted this assignment.");
      return;
    }

    if (!submissionDraft.mode) {
      setErrorMessage("Choose a submission type first.");
      return;
    }

    let uploadFile =
      submissionFile;

    const essayTitle =
      submissionDraft.essayTitle.trim() || selectedAssignment.title;

    if (submissionDraft.mode === "text") {
      const cleanText =
        submissionDraft.text.trim();

      if (!cleanText) {
        setErrorMessage("Paste your essay text before submitting.");
        return;
      }

      uploadFile =
        new File([cleanText], `${sanitizeFileName(essayTitle)}.txt`, {
          type: "text/plain",
        });
    }

    if (!uploadFile) {
      setErrorMessage("Choose a file before submitting.");
      return;
    }

    if (submissionDraft.mode === "picture" && !uploadFile.type?.startsWith("image/")) {
      setErrorMessage("Choose an image file for picture submissions.");
      return;
    }

    setIsSubmittingEssay(true);

    const safeFileName =
      sanitizeFileName(uploadFile.name);

    const filePath =
      `${profile.id}/${selectedAssignment.id}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } =
      await supabase
        .storage
        .from(ESSAY_BUCKET)
        .upload(filePath, uploadFile, {
          contentType: uploadFile.type || "application/octet-stream",
        });

    if (uploadError) {
      setErrorMessage(uploadError.message);
      setIsSubmittingEssay(false);
      return;
    }

    const { error: submissionError } =
      await supabase
        .from(SUBMISSION_TABLE)
        .insert({
          assignment_id: selectedAssignment.id,
          classroom_id: selectedAssignment.classroomId,
          student_id: profile.id,
          essay_title: essayTitle,
          file_url: filePath,
          status: "submitted",
        });

    if (submissionError) {
      setErrorMessage(submissionError.message);
      setIsSubmittingEssay(false);
      return;
    }

    setSuccessMessage("Assignment submitted.");
    setSubmissionDraft(emptySubmissionDraft);
    setSubmissionFile(null);
    setIsSubmittingEssay(false);
    setActivePage("submissions");
    await loadStudentData();
  };

  const displayName =
    profile?.full_name || profile?.email || "Student";

  return (
    <div className="min-h-screen bg-[#f4f3ef] text-gray-950">
      <Header
        workspace="Student workspace"
        pages={studentPages}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
            Welcome back
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-normal">
            {displayName}
          </h2>
          <p className="mt-2 max-w-[620px] text-base font-semibold leading-7 text-gray-500">
            View your classrooms, open assignment bins, and submit essay images.
          </p>
        </section>

        <div className="mb-8">
          <StatusMessage
            error={errorMessage}
            message={successMessage}
          />
        </div>

        {activePage === "classrooms" && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <form
              onSubmit={handleJoinClassroom}
              className="h-fit rounded-lg border border-gray-200 bg-white p-6"
            >
              <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                Join classroom
              </p>
              <h3 className="mt-2 text-2xl font-black">
                Enter class code
              </h3>
              <input
                type="text"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Example: CW12A"
                className="mt-5 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold uppercase outline-none transition placeholder:normal-case focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                required
              />
              <button
                type="submit"
                disabled={isJoiningClassroom}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                <PlusIcon className="h-4 w-4" />
                {isJoiningClassroom ? "Joining..." : "Join"}
              </button>
            </form>

            <div className="grid gap-5 md:grid-cols-2">
              {isLoading && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <p className="text-sm font-bold text-gray-500">
                    Loading classrooms...
                  </p>
                </div>
              )}

              {!isLoading && classrooms.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="text-xl font-black text-gray-950">
                    No classrooms joined yet
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-gray-500">
                    Enter the code your teacher shared to join a classroom.
                  </p>
                </div>
              )}

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
                      {classroom.teacher}
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-sm font-bold text-gray-500">
                      {classroom.section} | Class code {classroom.code}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <strong className="block text-xl font-black">
                          {classroom.assignments}
                        </strong>
                        <span className="text-xs font-bold text-gray-500">
                          Assignments
                        </span>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <strong className="block text-xl font-black">
                          {classroom.submissions}
                        </strong>
                        <span className="text-xs font-bold text-gray-500">
                          Submitted
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewClassroomAssignments(classroom.id)}
                      className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                    >
                      View assignments
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activePage === "assignments" && (
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                  Assignment bins
                </p>
                <h2 className="mt-2 text-4xl font-black tracking-normal">
                  Assigned essays
                </h2>
                {selectedClassroom && (
                  <p className="mt-2 text-sm font-bold text-gray-500">
                    {selectedClassroom.name} | {selectedClassroom.section}
                  </p>
                )}
              </div>

              {classrooms.length > 1 && (
                <label className="block w-full sm:w-[280px]">
                  <span className="text-sm font-extrabold text-gray-800">
                    Classroom
                  </span>
                  <select
                    value={selectedClassroomId}
                    onChange={(event) => {
                      setSelectedClassroomId(event.target.value);
                      setSubmissionDraft(emptySubmissionDraft);
                      setSubmissionFile(null);
                    }}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  >
                    {classrooms.map((classroom) => (
                      <option
                        key={classroom.id}
                        value={classroom.id}
                      >
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {visibleAssignments.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <p className="text-sm font-bold text-gray-500">
                    No assignments available yet.
                  </p>
                </div>
              )}

              {visibleAssignments.map((assignment) => {
                const isDraftOpen =
                  submissionDraft.assignmentId === assignment.id;

                const isSubmitDisabled =
                  isSubmittingEssay ||
                  !submissionDraft.mode ||
                  (submissionDraft.mode === "text"
                    ? !submissionDraft.text.trim()
                    : !submissionFile);

                return (
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
                      <span
                        className={
                          assignment.submitted
                            ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700"
                            : "rounded-lg bg-amber-50 px-3 py-2 text-sm font-black text-amber-700"
                        }
                      >
                        {assignment.submitted ? "Submitted" : "Open"}
                      </span>
                    </div>

                    {assignment.instructions && (
                      <p className="mt-4 text-sm font-semibold leading-6 text-gray-600">
                        {assignment.instructions}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      {assignment.submitted ? (
                        <button
                          type="button"
                          onClick={() =>
                            openSubmissionFile(
                              assignment.submission?.file_url,
                              setErrorMessage
                            )
                          }
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                        >
                          Open submission
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            isDraftOpen
                              ? setSubmissionDraft(emptySubmissionDraft)
                              : handleOpenSubmissionDraft(assignment)
                          }
                                                 
                        
                          className={
                              isDraftOpen
                                ? "inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-600 px-4 text-sm font-extrabold text-white transition hover:bg-red-700"
                                : "inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                            }   
                        >
                          {isDraftOpen ? "Close" :"Turn in"}
                        </button>
                      )}
                    </div>

                    {isDraftOpen && !assignment.submitted && (
                      <form
                        onSubmit={handleSubmitAssignment}
                        className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5"
                      >
                        <label className="block">
                          <span className="text-sm font-extrabold text-gray-800">
                            Essay title
                          </span>
                          <input
                            type="text"
                            value={submissionDraft.essayTitle}
                            onChange={(event) =>
                              setSubmissionDraft((currentDraft) => ({
                                ...currentDraft,
                                essayTitle: event.target.value,
                              }))
                            }
                            className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                            required
                          />
                        </label>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          {submissionModes.map(({ id, label, icon: Icon }) => {
                            const isActive =
                              submissionDraft.mode === id;

                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => handleSubmissionModeChange(id)}
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

                        <div className="mt-5">
                          {!submissionDraft.mode && (
                            <div className="grid min-h-[260px] place-items-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 text-center">
                              <div>
                                <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                                  <UploadIcon className="h-8 w-8" />
                                </span>
                                <h3 className="mt-5 text-xl font-black text-gray-950">
                                  Choose a submission type first
                                </h3>
                              </div>
                            </div>
                          )}

                          {(submissionDraft.mode === "picture" || submissionDraft.mode === "file") && (
                            <>
                              <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 text-center transition hover:border-emerald-600 hover:bg-emerald-50">
                                {filePreview ? (
                                  <img
                                    src={filePreview}
                                    alt="Selected submission preview"
                                    className="max-h-[260px] w-full rounded-lg object-contain"
                                  />
                                ) : (
                                  <>
                                    <span className="grid h-20 w-20 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                                      {submissionDraft.mode === "picture" ? (
                                        <ImageIcon className="h-10 w-10" />
                                      ) : (
                                        <UploadIcon className="h-10 w-10" />
                                      )}
                                    </span>
                                    <span className="mt-6 text-2xl font-black text-gray-950">
                                      {submissionDraft.mode === "picture" ? "Upload a picture" : "Upload a file"}
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept={
                                    submissionDraft.mode === "picture"
                                      ? "image/png,image/jpeg,image/jpg,image/webp"
                                      : ACCEPTED_CHECK_FILE_TYPES
                                  }
                                  onChange={(event) =>
                                    setSubmissionFile(event.target.files?.[0] ?? null)
                                  }
                                  className="sr-only"
                                  required
                                />
                              </label>

                              {submissionFile && (
                                <div className="mt-5 rounded-lg border border-gray-200 bg-white">
                                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-gray-100 px-4 py-3 text-xs font-extrabold uppercase tracking-normal text-gray-500">
                                    <span>File</span>
                                    <span>Type</span>
                                    <span>Size</span>
                                  </div>

                                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 text-sm">
                                    <span className="min-w-0 truncate font-extrabold text-gray-950">
                                      {submissionFile.name}
                                    </span>
                                    <span className="font-bold text-gray-500">
                                      {getFileKind(submissionFile)}
                                    </span>
                                    <span className="font-bold text-gray-500">
                                      {formatFileSize(submissionFile.size)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {submissionDraft.mode === "text" && (
                            <label className="block">
                              <span className="text-sm font-extrabold text-gray-800">
                                Paste text
                              </span>
                              <textarea
                                value={submissionDraft.text}
                                onChange={(event) =>
                                  setSubmissionDraft((currentDraft) => ({
                                    ...currentDraft,
                                    text: event.target.value,
                                  }))
                                }
                                className="mt-2 min-h-[300px] w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-sm font-semibold leading-6 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                required
                              />
                            </label>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitDisabled}
                          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-base font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          <UploadIcon className="h-5 w-5" />
                          {isSubmittingEssay ? "Submitting..." : "Submit assignment"}
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activePage === "submissions" && (
          <div>
            <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
              Turned in
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-normal">
              My submissions
            </h2>

            <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-[1fr_1fr_0.8fr_0.7fr] gap-4 border-b border-gray-200 px-5 py-3 text-xs font-extrabold uppercase tracking-normal text-gray-500">
                <span>Assignment</span>
                <span>Essay</span>
                <span>Status</span>
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
                  className="grid grid-cols-[1fr_1fr_0.8fr_0.7fr] gap-4 border-b border-gray-100 px-5 py-4 text-sm last:border-b-0"
                >
                  <span className="font-extrabold text-gray-950">
                    {submission.assignmentTitle}
                  </span>
                  <span className="font-semibold text-gray-600">
                    {submission.essayTitle}
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    {submission.status}
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
      </main>
    </div>
  );
}




