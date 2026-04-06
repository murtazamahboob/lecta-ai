import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, Mail, FileAudio, Users, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface Submission {
  id: string;
  user_id: string;
  subject: string;
  emails: string;
  audio_filename: string | null;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "submissions">("users");

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, subsRes] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
    ]);
    setRoles((rolesRes.data as UserRole[]) || []);
    setSubmissions((subsRes.data as Submission[]) || []);
    setLoading(false);
  };

  const removeRole = async (userId: string, role: string) => {
    if (userId === user?.id) {
      toast.error("You cannot remove your own admin role");
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as any);
    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success("Role removed");
      fetchData();
    }
  };

  if (!isAdmin) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users and view all submissions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-muted p-1 gap-1">
          <button
            onClick={() => setTab("users")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              tab === "users" ? "gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            Users & Roles
          </button>
          <button
            onClick={() => setTab("submissions")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              tab === "submissions" ? "gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4" />
            All Submissions ({submissions.length})
          </button>
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : roles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No user roles found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4 font-medium">User ID</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="p-4 text-foreground font-mono text-xs truncate max-w-[200px]">{r.user_id}</td>
                      <td className="p-4">
                        <Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeRole(r.user_id, r.role)}
                          disabled={r.user_id === user?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {tab === "submissions" && (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileAudio className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No submissions yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-4 font-medium">Subject</th>
                      <th className="text-left p-4 font-medium">Recipients</th>
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="p-4 text-foreground font-medium truncate max-w-[180px]">{s.subject}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[150px]">{s.emails}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{s.user_id.slice(0, 8)}…</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-success/10 text-success-foreground border border-success/20 text-xs capitalize">
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(s.created_at), "MMM d, yyyy · h:mm a")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
