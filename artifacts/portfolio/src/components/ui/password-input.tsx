import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export function PasswordInput({ className, wrapperClassName, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`relative group ${wrapperClassName || ""}`}>
      <Input
        type={visible ? "text" : "password"}
        className={`pr-10 transition-all ${className || ""}`}
        autoComplete="current-password"
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible(v => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-white/25 hover:text-white/60 focus:outline-none transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
