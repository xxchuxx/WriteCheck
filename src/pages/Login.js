import { useState } from "react";

import { Link, useNavigate }
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

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const handleLogin = async (event) => {

    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      navigate("/dashboard");
    }
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
          onSubmit={handleLogin}
          className="w-full max-w-[420px] rounded-lg border border-white/40 bg-white/95 p-8 shadow-2xl backdrop-blur"
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
            Login
          </h1>

          <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
            Sign in to continue to your WriteCheck dashboard.
          </p>

          <label className="mt-7 block text-sm font-extrabold text-gray-800">
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
            type="password"
            placeholder="Enter your password"
            value={password}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          {errorMessage && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-emerald-700 px-5 text-base font-extrabold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-5 text-center text-sm font-medium text-gray-500">

            Don't have an account?

            <Link
              to="/register"
              className="ml-1 font-extrabold text-emerald-700 transition hover:text-emerald-900"
            >
              Register
            </Link>

          </p>

        </form>
      </div>
    </div>
  );
}

