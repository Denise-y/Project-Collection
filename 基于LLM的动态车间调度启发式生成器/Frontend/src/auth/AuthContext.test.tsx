// @vitest-environment jsdom
/**
 * Author: Minpei LIN (AuthContext unit tests)
 */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";

const STORAGE_KEY = "intellisched.auth.v1";

function AuthHarness() {
  const { token, user, setAuth, logout } = useAuth();

  return (
    <div>
      <div data-testid="token">{token ?? "none"}</div>
      <div data-testid="username">{user?.username ?? "none"}</div>
      <button
        onClick={() =>
          setAuth({
            token: "token-123",
            user: { id: "user-1", username: "alice", email: "alice@example.com", role: "user" },
          })
        }
      >
        sign-in
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("hydrates initial auth state from localStorage", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: "persisted-token",
        user: { id: "1", username: "persisted-user", role: "user" },
      })
    );

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    expect(screen.getByTestId("token").textContent).toBe("persisted-token");
    expect(screen.getByTestId("username").textContent).toBe("persisted-user");
  });

  it("falls back to empty state when localStorage contains invalid JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-valid-json");

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    expect(screen.getByTestId("token").textContent).toBe("none");
    expect(screen.getByTestId("username").textContent).toBe("none");
  });

  it("setAuth updates context state and persists it", () => {
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("sign-in"));

    expect(screen.getByTestId("token").textContent).toBe("token-123");
    expect(screen.getByTestId("username").textContent).toBe("alice");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")).toEqual({
      token: "token-123",
      user: { id: "user-1", username: "alice", email: "alice@example.com", role: "user" },
    });
  });

  it("logout clears state and persisted auth", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: "persisted-token",
        user: { id: "1", username: "persisted-user", role: "user" },
      })
    );

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("logout"));

    expect(screen.getByTestId("token").textContent).toBe("none");
    expect(screen.getByTestId("username").textContent).toBe("none");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null")).toEqual({
      token: null,
      user: null,
    });
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    function BrokenConsumer() {
      useAuth();
      return null;
    }

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BrokenConsumer />)).toThrow("useAuth must be used within AuthProvider");
    consoleError.mockRestore();
  });
});
