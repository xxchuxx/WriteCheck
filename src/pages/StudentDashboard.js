import { useCallback, useEffect, useState } from "react";

import { supabase } from "../supabaseClient";
import {
  ASSIGNMENT_TABLE,
  CLASSROOM_TABLE,
  ESSAY_BUCKET,
  MEMBER_TABLE,
  SUBMISSION_TABLE,
  Header,
  ImageIcon,
  PlusIcon,
  StatusMessage,
  UploadIcon,
  emptySubmissionForm,
  formatDateTime,
  normalizeAssignment,
  normalizeClassroom,
  openSubmissionFile,
  studentPages,
} from "./dashboard/shared";
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

  const [submissionForm, setSubmissionForm] =
    useState(emptySubmissionForm);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
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
    assignments.find((assignment) => assignment.id === submissionForm.assignmentId) ??
    assignments[0];

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
      setSubmissionForm(emptySubmissionForm);
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
    setSubmissionForm((currentForm) => ({
      ...currentForm,
      assignmentId:
        nextAssignments.some((assignment) => assignment.id === currentForm.assignmentId)
          ? currentForm.assignmentId
          : nextAssignments[0]?.id ?? "",
    }));
    setIsLoading(false);
  }, [profile.id]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return undefined;
    }

    const previewUrl =
      URL.createObjectURL(selectedImage);

    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

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

  const handleSubmitEssay = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedAssignment || !selectedImage) {
      return;
    }

    if (selectedAssignment.submitted) {
      setErrorMessage("You already submitted this assignment.");
      return;
    }

    setIsSubmittingEssay(true);

    const safeFileName =
      selectedImage.name.replace(/[^a-zA-Z0-9._-]/g, "-");

    const filePath =
      `${profile.id}/${selectedAssignment.id}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } =
      await supabase
        .storage
        .from(ESSAY_BUCKET)
        .upload(filePath, selectedImage, {
          contentType: selectedImage.type,
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
          essay_title: submissionForm.essayTitle.trim() || selectedAssignment.title,
          file_url: filePath,
          status: "submitted",
        });

    if (submissionError) {
      setErrorMessage(submissionError.message);
      setIsSubmittingEssay(false);
      return;
    }

    setSuccessMessage("Essay submitted.");
    setSubmissionForm({
      ...emptySubmissionForm,
      assignmentId: selectedAssignment.id,
    });
    setSelectedImage(null);
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
                      onClick={() => setActivePage("assignments")}
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
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section>
              <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                Assignment bins
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-normal">
                Assigned essays
              </h2>

              <div className="mt-6 space-y-4">
                {assignments.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <p className="text-sm font-bold text-gray-500">
                      No assignments available yet.
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

                    <button
                      type="button"
                      onClick={() =>
                        setSubmissionForm((currentForm) => ({
                          ...currentForm,
                          assignmentId: assignment.id,
                        }))
                      }
                      disabled={assignment.submitted}
                      className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      Select
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <form
              onSubmit={handleSubmitEssay}
              className="h-fit rounded-lg border border-gray-200 bg-white p-6"
            >
              <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
                Submit essay
              </p>
              <h3 className="mt-2 text-2xl font-black">
                Upload image
              </h3>

              <label className="mt-6 block">
                <span className="text-sm font-extrabold text-gray-800">
                  Assignment
                </span>
                <select
                  value={submissionForm.assignmentId}
                  onChange={(event) =>
                    setSubmissionForm((currentForm) => ({
                      ...currentForm,
                      assignmentId: event.target.value,
                    }))
                  }
                  disabled={assignments.length === 0}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  required
                >
                  {assignments.length === 0 && (
                    <option value="">
                      No assignments yet
                    </option>
                  )}
                  {assignments.map((assignment) => (
                    <option
                      key={assignment.id}
                      value={assignment.id}
                      disabled={assignment.submitted}
                    >
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-extrabold text-gray-800">
                  Essay title
                </span>
                <input
                  type="text"
                  value={submissionForm.essayTitle}
                  onChange={(event) =>
                    setSubmissionForm((currentForm) => ({
                      ...currentForm,
                      essayTitle: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>

              <label className="mt-6 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 text-center transition hover:border-emerald-600 hover:bg-emerald-50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Selected essay submission preview"
                    className="max-h-[230px] w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <span className="grid h-16 w-16 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                      <ImageIcon className="h-8 w-8" />
                    </span>
                    <span className="mt-5 text-lg font-extrabold text-gray-950">
                      Select essay image
                    </span>
                    <span className="mt-2 text-sm font-semibold text-gray-500">
                      PNG, JPG, JPEG, or WEBP
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                  className="sr-only"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={
                  isSubmittingEssay ||
                  !selectedImage ||
                  assignments.length === 0 ||
                  selectedAssignment?.submitted
                }
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-base font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                <UploadIcon className="h-5 w-5" />
                {isSubmittingEssay ? "Submitting..." : "Submit essay"}
              </button>
            </form>
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




