import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Trash2, Mail, FileAudio, Users, History,
  TrendingUp, Clock, Target, Activity, Zap, UserPlus, User
} from "lucide-react";
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
  weak_points: string | null;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-glow">
      <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full ${accent} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`} />
      <div className="relative z-10 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl ${accent} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]" />
      </span>
      Live
    </span>
  );
}

export default function AdminPage() {
  const { isAdmin, user, loading: authLoading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "submissions">("overview");
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator" | "user">("moderator");

  const fetchData = async (showLoader = true) => {
    if (showLoader) setDataLoading(true);

    const [rolesRes, subsRes, profilesRes, emailsRes] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.rpc("get_user_emails"),
    ]);

    if (rolesRes.error || subsRes.error) {
      if (showLoader) toast.error("Failed to load admin data");
      setRoles([]);
      setSubmissions([]);
      setDataLoading(false);
      return;
    }

    // Build email lookup map
    const emailMap: Record<string, string> = {};
    if (emailsRes.data) {
      (emailsRes.data as { user_id: string; email: string }[]).forEach((e) => {
        emailMap[e.user_id] = e.email;
      });
    }

    setRoles((rolesRes.data as UserRole[]) || []);
    setSubmissions((subsRes.data as Submission[]) || []);
    setProfiles((profilesRes.data as Profile[]) || []);
    setUserEmails(emailMap);
    setDataLoading(false);
  };

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!isAdmin) {
      setDataLoading(false);
      return;
    }
    void fetchData();
    const interval = setInterval(() => void fetchData(false), 10000);
    return () => clearInterval(interval);
  }, [authLoading, roleLoading, isAdmin]);

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
      void fetchData(false);
    }
  };

  const addRole = async () => {
    const trimmed = newUserId.trim();
    if (!trimmed) {
      toast.error("Please enter a user ID");
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: trimmed, role: newRole });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "User already has this role" : "Failed to add role");
    } else {
      toast.success(`${newRole} role added`);
      setNewUserId("");
      void fetchData(false);
    }
  };

  const deleteSubmission = async (id: string) => {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete submission");
    } else {
      toast.success("Submission deleted");
      void fetchData(false);
    }
  };

  // Helper to get profile/email for a user_id
  const getProfileName = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    return profile?.display_name || "—";
  };

  // Get unique user emails from submissions
  const getUserEmails = () => {
    const emailMap = new Map<string, { userId: string; emails: Set<string>; name: string }>();
    submissions.forEach((s) => {
      if (!emailMap.has(s.user_id)) {
        emailMap.set(s.user_id, {
          userId: s.user_id,
          emails: new Set(),
          name: getProfileName(s.user_id),
        });
      }
      s.emails.split(",").forEach((e) => emailMap.get(s.user_id)!.emails.add(e.trim()));
    });
    return Array.from(emailMap.values());
  };

  const totalSubmissions = submissions.length;
  const uniqueUsers = new Set(submissions.map((s) => s.user_id)).size;
  const todayCount = submissions.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;
  const recentSubmissions = submissions.slice(0, 5);

  const weakPointsMap: Record<string, number> = {};
  submissions.forEach((s) => {
    if (s.weak_points && s.weak_points.trim()) {
      const key = s.weak_points.trim().toLowerCase();
      weakPointsMap[key] = (weakPointsMap[key] || 0) + 1;
    }
  });
  const topWeakPoints = Object.entries(weakPointsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (authLoading || roleLoading) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-float-up">
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
      <div className="max-w-6xl mx-auto space-y-6 animate-float-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Lecta.ai Command Center</h1>
              <p className="text-sm text-muted-foreground">Monitor & manage your platform</p>
            </div>
          </div>
          <LiveIndicator />
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted/50 p-1 gap-1 backdrop-blur">
          {[
            { key: "overview", label: "Overview", icon: Activity },
            { key: "users", label: "Users & Roles", icon: Users },
            { key: "submissions", label: `Submissions (${totalSubmissions})`, icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                tab === key
                  ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FileAudio} label="Total Submissions" value={totalSubmissions} accent="gradient-primary" />
              <StatCard icon={Users} label="Active Users" value={uniqueUsers} accent="bg-[hsl(var(--accent))]" />
              <StatCard icon={Zap} label="Today" value={todayCount} accent="bg-[hsl(var(--success))]" />
              <StatCard icon={TrendingUp} label="Admin Users" value={roles.filter(r => r.role === "admin").length} accent="bg-[hsl(var(--destructive))]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                </div>
                {dataLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading…</div>
                ) : recentSubmissions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No activity yet</div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentSubmissions.map((s) => (
                      <div key={s.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                        <div className="h-8 w-8 rounded-lg gradient-subtle flex items-center justify-center shrink-0">
                          <FileAudio className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(s.created_at), "MMM d · h:mm a")}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success-foreground border border-success/20 text-xs capitalize shrink-0">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Weak Points */}
              <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Top Weak Points</h2>
                </div>
                {topWeakPoints.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No weak points reported yet</div>
                ) : (
                  <div className="p-4 space-y-3">
                    {topWeakPoints.map(([point, count], i) => {
                      const maxCount = topWeakPoints[0][1];
                      const pct = (count / maxCount) * 100;
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-foreground capitalize truncate max-w-[70%]">{point}</span>
                            <span className="text-xs text-muted-foreground">{count} mention{count > 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-primary transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* All Users Table */}
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">All Users</h2>
              </div>
              {profiles.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No users yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground bg-muted/30">
                        <th className="text-left p-4 font-medium">User ID</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Display Name</th>
                        <th className="text-left p-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-mono text-xs text-muted-foreground">{p.id.slice(0, 12)}…</td>
                          <td className="p-4 text-foreground flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {userEmails[p.id] || "—"}
                          </td>
                          <td className="p-4 text-foreground">{p.display_name || "—"}</td>
                          <td className="p-4 text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Add Role Form */}
            <div className="rounded-2xl border border-border bg-card shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Add Role</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="User ID (UUID)"
                  className="flex-1 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all font-mono"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
                <Button onClick={addRole} className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-all duration-300 active:scale-[0.97]">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              {dataLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : roles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No user roles found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/30">
                      <th className="text-left p-4 font-medium">User ID</th>
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-foreground font-mono text-xs truncate max-w-[200px]">{r.user_id.slice(0, 12)}…</td>
                        <td className="p-4 text-foreground text-sm">{getProfileName(r.user_id)}</td>
                        <td className="p-4">
                          <Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
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
          </div>
        )}

        {/* Submissions Tab */}
        {tab === "submissions" && (
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            {dataLoading ? (
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
                    <tr className="border-b border-border text-muted-foreground bg-muted/30">
                      <th className="text-left p-4 font-medium">Subject</th>
                      <th className="text-left p-4 font-medium">Recipients</th>
                      <th className="text-left p-4 font-medium">Weak Points</th>
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-foreground font-medium truncate max-w-[160px]">{s.subject}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[130px]">{s.emails}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {s.weak_points ? (
                            <span className="text-xs text-primary truncate max-w-[150px] block">{s.weak_points}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-xs text-foreground">{getProfileName(s.user_id)}</p>
                            <p className="font-mono text-xs text-muted-foreground">{s.user_id.slice(0, 8)}…</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-success/10 text-success-foreground border border-success/20 text-xs capitalize">
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(s.created_at), "MMM d, yyyy · h:mm a")}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                            onClick={() => deleteSubmission(s.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
