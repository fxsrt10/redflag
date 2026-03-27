"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  companyName: string;
  riskScore: number;
  riskLevel: string;
}

export function ShareCard({ companyName, riskScore, riskLevel }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = `${companyName} has a RedFlag Risk Score of ${riskScore}/100 (${riskLevel}). Check your company's score:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <Share2 className="w-3.5 h-3.5 text-muted" />
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        title="Share on X/Twitter"
      >
        <span className="text-[10px] font-bold text-muted hover:text-white">𝕏</span>
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        title="Share on LinkedIn"
      >
        <span className="text-[10px] font-bold text-muted hover:text-white">in</span>
      </a>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        title="Copy link"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <LinkIcon className="w-3.5 h-3.5 text-muted hover:text-white" />
        )}
      </button>
    </div>
  );
}
