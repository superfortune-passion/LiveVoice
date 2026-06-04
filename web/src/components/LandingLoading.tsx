/** Lightweight shell shown while the client app bundle loads. */
export function LandingLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#0D0F17] text-white">
      <header className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-white/8 px-4 sm:h-20 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[#FF00C2] to-[#00E5FF] opacity-80"
            aria-hidden
          />
          <span className="text-lg font-bold tracking-tight">VoiceLink</span>
        </div>
        <div className="h-6 w-20 rounded-full bg-white/10" aria-hidden />
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="space-y-2">
          <div className="h-8 max-w-md rounded-lg bg-white/10" />
          <div className="h-4 max-w-sm rounded bg-white/6" />
        </div>
        <div className="min-h-[140px] flex-1 rounded-2xl border border-white/10 bg-white/[0.03]" />
        <div className="h-24 rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5" />
        <div className="h-32 rounded-2xl border border-white/10 bg-white/[0.03]" />
      </main>
    </div>
  );
}
