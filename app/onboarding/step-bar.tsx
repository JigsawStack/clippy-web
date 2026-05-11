export function StepBar({ current }: { current: number }) {
  const steps = ["Profile", "Plan", "Notifications"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                done
                  ? "bg-indigo-600 text-white"
                  : active
                  ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? "✓" : step}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                active ? "text-slate-900 font-medium" : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 ${
                  done ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
