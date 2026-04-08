import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { History, FileAudio, Mail } from "lucide-react";
import { format } from "date-fns";

interface Submission {
  id: string;
  subject: string;
  emails: string;
  audio_filename: string | null;
  weak_points: string | null;
  status: string;
  created_at: string;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (authLoading) return;
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const { data } = await supabase
          .from("submissions")
          .select("*")
          .order("created_at", { ascending: false });

        if (!isMounted) return;
        setSubmissions((data as Submission[]) || []);
        setLoading(false);
      } catch {
        if (!isMounted) return;
        setSubmissions([]);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <History className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Upload History</h1>
            <p className="text-sm text-muted-foreground">Your past lecture submissions</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileAudio className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No submissions yet. Upload your first lecture!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {submissions.map((s) => (
                <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{s.subject}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{s.emails}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success-foreground border border-success/20 capitalize">
                      {s.status}
                    </span>
                    <span>{format(new Date(s.created_at), "MMM d, yyyy · h:mm a")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
