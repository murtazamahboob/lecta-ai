import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Lecture Ghost</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <Button
          onClick={signInWithGoogle}
          className="w-full gradient-primary text-primary-foreground font-semibold gap-2"
          size="lg"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </Button>
      </div>
    </main>
  );
}
