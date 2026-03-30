"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a confirmation link.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0C0F14", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#7CCA98", boxShadow: "0 0 10px #7CCA98" }} />
            <span style={{ fontSize: 28, fontWeight: 700, color: "#E8ECF4", letterSpacing: "-0.02em" }}>Horizon</span>
          </div>
          <p style={{ color: "#5E6882", fontSize: 14 }}>Financial Planning Platform</p>
        </div>

        <div style={{ background: "#13171E", borderRadius: 16, padding: 28, border: "1px solid #2A3040" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E8ECF4", marginBottom: 20, textAlign: "center" }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <button onClick={() => handleOAuth("google")}
              style={{ width: "100%", padding: "12px 16px", background: "#1A1F28", border: "1px solid #2A3040", borderRadius: 10, color: "#E8ECF4", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Continue with Google
            </button>
            <button onClick={() => handleOAuth("apple")}
              style={{ width: "100%", padding: "12px 16px", background: "#1A1F28", border: "1px solid #2A3040", borderRadius: 10, color: "#E8ECF4", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Continue with Apple
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#2A3040" }} />
            <span style={{ fontSize: 12, color: "#5E6882" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#2A3040" }} />
          </div>

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
              style={{ width: "100%", padding: "12px 14px", background: "#1A1F28", border: "1px solid #2A3040", borderRadius: 10, color: "#E8ECF4", fontSize: 14, outline: "none" }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6}
              style={{ width: "100%", padding: "12px 14px", background: "#1A1F28", border: "1px solid #2A3040", borderRadius: 10, color: "#E8ECF4", fontSize: 14, outline: "none" }} />

            {error && <div style={{ color: "#E8927C", fontSize: 13, padding: "8px 12px", background: "rgba(232,146,124,0.12)", borderRadius: 8 }}>{error}</div>}
            {message && <div style={{ color: "#7CCA98", fontSize: 13, padding: "8px 12px", background: "rgba(124,202,152,0.12)", borderRadius: 8 }}>{message}</div>}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px 16px", background: "#5B8DEF", border: "none", borderRadius: 10, color: "#0C0F14", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              style={{ background: "none", border: "none", color: "#5B8DEF", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
