/**
 * Author: Yushan WANG (authentication page and UX flow)
 * Collaborator: Zizhen WANG (backend auth API integration)
 */

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApiClient } from "@/lib/apiClient";
import { useAuth } from "@/auth/AuthContext";

type LoginResponse = {
  access_token?: string;
  token?: string;
  token_type?: string;
  user?: {
    id: string | number;
    username: string;
    email?: string | null;
    role?: string | null;
  };
};

type RegisterResponse = {
  user?: {
    id: string | number;
    username: string;
    email?: string | null;
    role?: string | null;
  };
};

export function AuthPage({ baseUrl }: { baseUrl: string }) {
  const { setAuth } = useAuth();
  const api = useMemo(() => createApiClient({ baseUrl }), [baseUrl]);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  const doLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<LoginResponse>("/api/auth/login", {
        username: loginUsername.trim(),
        password: loginPassword,
      });
      const token = res.access_token ?? res.token;
      if (!token) throw new Error("Login succeeded but no token returned.");
      const user = res.user ?? { id: "me", username: loginUsername.trim() };
      setAuth({ token, user });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async () => {
    setError(null);
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regPassword2) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api.post<RegisterResponse>("/api/auth/register", {
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword,
      });
      setActiveTab("login");
      setLoginUsername(regUsername.trim());
      setLoginPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Register failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-slate-900">IntelliSched</h1>
          <p className="text-slate-600">Sign in to access scheduling and history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Username</div>
                  <Input
                    aria-label="Login username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Password</div>
                  <Input
                    aria-label="Login password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void doLogin();
                    }}
                  />
                </div>
                <Button className="w-full" disabled={busy} onClick={() => void doLogin()}>
                  {busy ? "Signing in..." : "Sign in"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Username</div>
                  <Input
                    aria-label="Register username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Email (optional)</div>
                  <Input
                    aria-label="Register email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Password</div>
                  <Input
                    aria-label="Register password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Confirm password</div>
                  <Input
                    aria-label="Register confirm password"
                    type="password"
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void doRegister();
                    }}
                  />
                </div>
                <Button className="w-full" disabled={busy} onClick={() => void doRegister()}>
                  {busy ? "Creating..." : "Create account"}
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

