"use client";

export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-center text-xs leading-relaxed text-slate-500">
        18+ only · No accounts · Reports are anonymous · Never share personal info
      </p>
    );
  }

  return (
    <aside
      className="glass-panel mx-auto max-w-lg rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 text-left"
      role="note"
      aria-label="Safety and privacy notice"
    >
      <h2 className="text-sm font-semibold text-amber-200">Safety & privacy</h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
        <li>You are anonymous — we do not require login or store personal data.</li>
        <li>Voice is peer-to-peer; we cannot monitor live conversations.</li>
        <li>Use <strong className="text-slate-300">Report</strong> if someone is abusive, then skip or end.</li>
        <li>Never share passwords, addresses, or payment details.</li>
        <li>Intended for users 18+. Leave immediately if you feel unsafe.</li>
      </ul>
    </aside>
  );
}
