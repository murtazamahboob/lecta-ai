import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, Mail, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        toast.success("Check your email to verify your account");
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Helmet>
        <title>Sign In — Lecta.Ai</title>
        <meta name="description" content="Sign in or create your Lecta.Ai account to turn lecture audio into AI-generated exam-ready notes and study materials." />
        <link rel="canonical" href="https://lecta-ai.lovable.app/login" />
        <meta property="og:title" content="Sign In — Lecta.Ai" />
        <meta property="og:description" content="Sign in to Lecta.Ai to turn lecture audio into AI-generated exam-ready notes." />
        <meta property="og:url" content="https://lecta-ai.lovable.app/login" />
      </Helmet>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card text-center space-y-6 animate-float-up">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl gradient-primary shadow-glow mb-2">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Lecta.ai — AI-Powered Lecture Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        <Button
          onClick={signInWithGoogle}
          className="w-full gradient-primary text-primary-foreground font-semibold gap-2 shadow-glow hover:opacity-90 transition-all duration-300 active:scale-[0.97]"
          size="lg"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </Button>

        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <div className="flex-1 h-px bg-border" />
          <span>or use email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
          <div className="space-y-1.5 form-field-focus">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
            />
          </div>
          <div className="space-y-1.5 form-field-focus">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
            />
          </div>
          <Button type="submit" disabled={loading} variant="secondary" className="w-full gap-2 transition-all duration-300 active:scale-[0.97]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {mode === "signin" ? "Sign in with Email" : "Sign up with Email"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
