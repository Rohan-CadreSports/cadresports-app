"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthTab = "email" | "phone";

export default function SignInPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
  }

  function handleSendOtp() {
    if (phone.length >= 10) setOtpSent(true);
  }

  async function handlePhoneSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    await signIn("phone", { phone, otp, callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[400px]">
        {/* Glass card */}
        <div className="bg-surface rounded-3xl shadow-[var(--shadow-lg)] border border-border-light p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="text-center">
            <img src="/logo.png" alt="CadreSports" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-4 shadow-[var(--shadow-md)]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to CadreSports</p>
          </div>

          {/* Google */}
          <Button variant="outline" className="w-full h-12" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-3 text-xs text-muted-foreground uppercase tracking-wider">or</span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-muted rounded-2xl p-1">
            <button
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                tab === "email" ? "bg-surface text-foreground shadow-[var(--shadow-sm)]" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTab("email")}
            >
              Email
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                tab === "phone" ? "bg-surface text-foreground shadow-[var(--shadow-sm)]" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTab("phone")}
            >
              Phone
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-2xl border border-red-100">{error}</div>
          )}

          {tab === "email" && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input id="password" label="Password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full h-12" loading={loading}>Sign In</Button>
            </form>
          )}

          {tab === "phone" && (
            <form onSubmit={handlePhoneSignIn} className="space-y-4">
              <Input id="phone" label="Phone Number" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              {!otpSent ? (
                <Button type="button" className="w-full h-12" onClick={handleSendOtp}>Send OTP</Button>
              ) : (
                <>
                  <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-2xl border border-emerald-100">
                    OTP sent! (Demo: enter any 6 digits)
                  </div>
                  <Input id="otp" label="Enter OTP" type="text" inputMode="numeric" placeholder="123456" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required />
                  <Button type="submit" className="w-full h-12" loading={loading}>Verify & Sign In</Button>
                </>
              )}
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-brand font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
