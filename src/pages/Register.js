import { useState } from "react";

import { Link }
from "react-router-dom";

import { supabase }
from "../supabaseClient";

import Startup from "./Startup";

function ArrowLeftIcon({ className = "h-5 w-5" }) {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export default function Register() {

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [role, setRole] =
    useState("student");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const handleRegister = async (event) => {

    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    if (data.session && data.user?.id) {
      const { error: profileError } =
        await supabase
          .from("userTable")
          .upsert([
            {
              id: data.user.id,
              full_name: fullName,
              email: email,
              role: role,
            },
          ]);

      if (profileError) {
        setErrorMessage(profileError.message);
        setIsLoading(false);
        return;
      }
    }

    setSuccessMessage("Verification email sent. Check your inbox.");
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      <div
        className="pointer-events-none absolute inset-0 scale-[1.02] blur-sm"
        aria-hidden="true"
      >
        <Startup />
      </div>

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">

        <form
          onSubmit={handleRegister}
          className="w-full max-w-[460px] rounded-lg border border-white/40 bg-white/95 p-8 shadow-2xl backdrop-blur"
        >

          <Link
            to="/"
            className="mb-7 grid h-11 w-11 place-items-center rounded-lg bg-emerald-700 text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            aria-label="Back to home"
            title="Back to home"
          >
            <ArrowLeftIcon />
          </Link>

          <h1 className="text-3xl font-black text-gray-950">
            Register
          </h1>

          <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
            Create your WriteCheck AI account to start checking essays.
          </p>

          <label className="mt-7 block text-sm font-extrabold text-gray-800">
            Full name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={(e) =>
              setFullName(e.target.value)
            }
            required
          />

          <label className="mt-5 block text-sm font-extrabold text-gray-800">
            Email
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label className="mt-5 block text-sm font-extrabold text-gray-800">
            Password
          </label>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
            />
            Show password
          </label>

          <label className="mt-5 block text-sm font-extrabold text-gray-800">
            Confirm password
          </label>

          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            required
          />

          <label className="mt-3 flex items-center gap-2 text-sm font-bold text-gray-600">
            <input
              type="checkbox"
              checked={showConfirmPassword}
              onChange={(e) => setShowConfirmPassword(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
            />
            Show confirm password
          </label>

          <label className="mt-5 block text-sm font-extrabold text-gray-800">
            Role
          </label>

          <select
            value={role}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={(e) =>
              setRole(e.target.value)
            }
          >

            <option value="student">
              Student
            </option>

            <option value="teacher">
              Teacher
            </option>

          </select>

          {errorMessage && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-emerald-700 px-5 text-base font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isLoading ? "Creating account..." : "Register"}
          </button>

          <p className="mt-5 text-center text-sm font-medium text-gray-500">

            Already have an account?

            <Link
              to="/login"
              className="ml-1 font-extrabold text-emerald-700 transition hover:text-emerald-900"
            >
              Login
            </Link>

          </p>

        </form>
      </div>
    </div>
  );
}
