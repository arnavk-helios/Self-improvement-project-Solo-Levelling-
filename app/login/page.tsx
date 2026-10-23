"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import "./login.css";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const result = isSignup
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      return;
    }

    // Signed in: go to the quest board.
    router.push("/");
    router.refresh();
  }

  function switchMode() {
    setMode(isSignup ? "signin" : "signup");
    setError("");
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-emblem">
          <div className="emblem-wrap">
            <div className="emblem">
              <div className="emblem-inner">
                <span className="emblem-letter" style={{ fontSize: "2.6rem" }}>
                  E
                </span>
              </div>
            </div>
          </div>
        </div>

        <h1>{isSignup ? "Create your account" : "Sign in"}</h1>
        <p className="auth-sub">
          {isSignup
            ? "Everyone starts at rank E."
            : "Pick up your quests where you left off."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="field">
              <label htmlFor="name">Hunter name</label>
              <input
                id="name"
                type="text"
                autoComplete="nickname"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              {isSignup ? "Password (at least 8 characters)" : "Password"}
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? "Please wait" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={switchMode}>
          {isSignup
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>
    </main>
  );
}