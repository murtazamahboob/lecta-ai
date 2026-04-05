import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  emails: string[];
  onChange: (emails: string[]) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailTagsInput({ emails, onChange }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const addEmail = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (!EMAIL_RE.test(trimmed)) {
      setError("Invalid email format");
      return;
    }
    if (emails.includes(trimmed)) {
      setError("Email already added");
      return;
    }
    onChange([...emails, trimmed]);
    setInput("");
    setError("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addEmail(input);
    }
    if (e.key === "Backspace" && !input && emails.length) {
      onChange(emails.slice(0, -1));
    }
  };

  const removeEmail = (email: string) => {
    onChange(emails.filter((e) => e !== email));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Recipient Emails
      </label>
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/50 p-3 focus-within:ring-2 focus-within:ring-ring transition-all">
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 rounded-md gradient-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(email)}
              className="rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addEmail(input)}
          placeholder={emails.length ? "" : "Add emails — press Enter or comma"}
          className="flex-1 min-w-[180px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
