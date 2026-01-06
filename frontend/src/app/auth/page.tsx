"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AuthPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string>("Checking...");
  const [message, setMessage] = useState<string | null>(null);

  // Load saved token for display.
  useEffect(() => {
    const stored = window.localStorage.getItem("auth_token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  // Check auth status using the stored token.
  const checkStatus = async (authToken?: string) => {
    setMessage(null);
    try {
      const res = await fetch(`${baseUrl}/api/auth/status/`, {
        headers: authToken ? { Authorization: `Token ${authToken}` } : {},
      });
      const data = await res.json();
      if (data?.authenticated) {
        setStatus(`Authenticated as ${data.username}`);
      } else {
        setStatus("Not authenticated");
      }
    } catch (err) {
      setStatus("Auth status unavailable");
    }
  };

  useEffect(() => {
    checkStatus(token);
  }, [token]);

  // Persist token for API calls.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem("auth_token", token.trim());
    setMessage("Token saved.");
  };

  // Clear token for sign-out.
  const clearToken = () => {
    window.localStorage.removeItem("auth_token");
    setToken("");
    setMessage("Token cleared.");
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Auth</h2>
        <p className="text-sm text-ink">
          Save a token to enable write access in the API.
        </p>
      </div>
      <div className="rounded-xl border border-ink bg-paper p-6">
        <p className="text-sm text-ink">Status: {status}</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="text-sm text-ink">API token</label>
          <input
            className="w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            value={token}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setToken(event.target.value)
            }
            placeholder="Paste token here"
          />
          <div className="flex flex-col gap-2 md:flex-row">
            <button
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper"
              type="submit"
            >
              Save token
            </button>
            <button
              className="rounded-lg border border-ink px-4 py-2 text-sm text-ink"
              type="button"
              onClick={clearToken}
            >
              Clear token
            </button>
          </div>
        </form>
        {message && <p className="mt-3 text-xs text-accent">{message}</p>}
      </div>
      <div className="rounded-xl border border-ink bg-paper p-6 text-sm text-ink">
        <p className="font-semibold">Token tips</p>
        <p className="mt-2">
          Request a token from <code>/api/auth/token/</code> using your admin
          credentials, then paste it here.
        </p>
      </div>
    </section>
  );
}
