import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

export default function JsonView({ data, title = "Raw API Response" }) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="varsity-card overflow-hidden border border-slate-200 mt-4">
      <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2 text-slate-200 text-xs font-semibold tracking-wide uppercase">
          <Code className="w-4 h-4 text-blue-400" />
          <span>{title}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>
      <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto max-h-96 text-xs font-mono leading-relaxed">
        <pre>{jsonString}</pre>
      </div>
    </div>
  );
}
