"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  apiFetch,
  clearTokens,
  getAccessToken,
  setTokens,
} from "@/lib/api";

type LoginResponse = { access: string; refresh: string };
type MeResponse = { id: number; username: string };

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("Checking...");
  const [message, setMessage] = useState<string | null>(null);

  // Check auth status using the stored token.
  const checkStatus = async () => {
    setMessage(null);
    try {
      const data = await apiFetch<MeResponse>("/api/auth/me/");
      setStatus(`Authenticated as ${data.username}`);
    } catch (err) {
      setStatus("Not authenticated");
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setStatus("Not authenticated");
      return;
    }
    checkStatus();
  }, []);

  // Login to obtain a JWT and store it.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setTokens(data.access, data.refresh);
      await checkStatus();
      setMessage("Token stored.");
    } catch (err) {
      setMessage("Login failed.");
    }
  };

  // Clear token for sign-out.
  const clearToken = () => {
    clearTokens();
    setStatus("Not authenticated");
    setMessage("Token cleared.");
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Auth</h2>
        <p className="text-sm text-ink">
          Sign in to store a JWT for write access in the API.
        </p>
      </div>
      <div className="rounded-xl border border-ink bg-paper p-6">
        <p className="text-sm text-ink">Status: {status}</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="text-sm text-ink">Username</label>
          <input
            className="w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            value={username}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setUsername(event.target.value)
            }
            placeholder="Username"
          />
          <label className="text-sm text-ink">Password</label>
          <input
            className="w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setPassword(event.target.value)
            }
            placeholder="Password"
          />
          <div className="flex flex-col gap-2 md:flex-row">
            <button
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper"
              type="submit"
            >
              Sign in
            </button>
            <button
              className="rounded-lg border border-ink px-4 py-2 text-sm text-ink"
              type="button"
              onClick={clearToken}
            >
              Sign out
            </button>
          </div>
        </form>
        {message && <p className="mt-3 text-xs text-accent">{message}</p>}
      </div>
      <div className="rounded-xl border border-ink bg-paper p-6 text-sm text-ink">
        <p className="font-semibold">JWT notes</p>
        <p className="mt-2">
          Tokens are stored in localStorage for now. Swap to httpOnly cookies in
          production.
        </p>
      </div>
    </section>
  );
}
