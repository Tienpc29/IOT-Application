import { useState } from "react";
import { Check, Copy } from "lucide-react";

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function CopyTimeButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className={`copy-time-btn${copied ? " copied" : ""}`}
      onClick={handleCopy}
      title={copied ? "Đã sao chép" : "Sao chép thời gian"}
      aria-label={copied ? "Đã sao chép thời gian" : "Sao chép thời gian"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
