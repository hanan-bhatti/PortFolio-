/**
 * @file app/(public)/resume/loading.tsx
 * @description Loading skeleton page for the Resume route.
 * 
 * @exports
 * - Loading (default): Main React component or function
 */

export default function Loading() {
  return (
    <div
      className="w-full min-h-screen relative"
      style={{
        backgroundColor: "#0a0a0a",
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      {/* Radial Gradient Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.7) 70%, #0a0a0a 100%)",
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-[1000px] px-4 pt-28 pb-20 animate-pulse">
        {/* Resume Card (WHITE Background Mockup) */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#ffffff",
            padding: "clamp(1.5rem, 4vw, 3rem)",
            boxShadow: "0 4px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Personal info strip */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
              marginBottom: "2rem",
              paddingBottom: "2rem",
              borderBottom: "1px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            {/* Avatar skeleton */}
            <div
              style={{
                width: 80,
                height: 80,
                flexShrink: 0,
                border: "3px solid #F59E0B",
                background: "#e5e7eb",
              }}
            />
            <div style={{ flex: 1 }}>
              <div className="h-6 bg-zinc-200 w-1/3 mb-2 rounded-none" />
              <div className="h-4 bg-zinc-200 w-1/4 mb-4 rounded-none" />
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="h-3 bg-zinc-200 w-24 rounded-none" />
                <div className="h-3 bg-zinc-200 w-32 rounded-none" />
                <div className="h-3 bg-zinc-200 w-28 rounded-none" />
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-[63%_37%] gap-8">
            {/* Left Column (Experience & Projects) */}
            <div className="space-y-8">
              <div>
                <div className="h-5 bg-zinc-200 w-32 mb-6 rounded-none" />
                <div className="space-y-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 bg-zinc-200 w-1/3 rounded-none" />
                        <div className="h-3 bg-zinc-200 w-20 rounded-none" />
                      </div>
                      <div className="h-3.5 bg-zinc-200 w-1/4 rounded-none" />
                      <div className="h-3 bg-zinc-200 w-5/6 rounded-none" />
                      <div className="h-3 bg-zinc-200 w-4/5 rounded-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Skills & Education) */}
            <div className="space-y-8">
              <div>
                <div className="h-5 bg-zinc-200 w-24 mb-6 rounded-none" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-zinc-200 w-1/2 rounded-none" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-zinc-100 w-16 border border-zinc-200 rounded-none" />
                        <div className="h-6 bg-zinc-100 w-20 border border-zinc-200 rounded-none" />
                        <div className="h-6 bg-zinc-100 w-12 border border-zinc-200 rounded-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
