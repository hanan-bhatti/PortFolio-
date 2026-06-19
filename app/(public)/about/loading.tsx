/**
 * @file app/(public)/about/loading.tsx
 * @description Loading skeleton page for the About route.
 * 
 * @exports
 * - Loading (default): Main React component or function
 */

export default function Loading() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen text-left" style={{ background: "#0a0a0a" }}>
      {/* SECTION 1: Hero */}
      <section className="relative min-h-[70vh] flex items-center pt-24 pb-12 w-full max-w-6xl mx-auto px-4 md:px-0">
        <div className="w-full grid gap-8 items-center grid-cols-1 md:grid-cols-[55%_45%] animate-pulse">
          {/* Left Side */}
          <div className="flex flex-col justify-center text-left">
            <div className="h-3.5 bg-white/5 w-24 mb-4 rounded-none" />
            <div className="h-16 bg-white/5 w-3/4 mb-3 rounded-none" />
            <div className="h-4 bg-white/5 w-2/3 mt-6 mb-2 rounded-none" />
            <div className="h-4 bg-white/5 w-1/2 mb-8 rounded-none" />
            <div className="h-12 bg-white/5 w-40 rounded-none" />
          </div>

          {/* Right Side (Avatar) */}
          <div className="relative flex items-center justify-center w-full min-h-[300px] md:min-h-[400px]">
            <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] bg-white/5 rounded-none" />
          </div>
        </div>
      </section>

      {/* SECTION 2: The Story */}
      <section className="py-20 px-4 md:px-0 border-t border-b border-[#262626] bg-[#111111]/30">
        <div className="max-w-[760px] mx-auto animate-pulse">
          <div className="h-3.5 bg-white/5 w-24 mb-6 rounded-none" />
          <div className="space-y-4">
            <div className="h-4 bg-white/5 w-full rounded-none" />
            <div className="h-4 bg-white/5 w-11/12 rounded-none" />
            <div className="h-4 bg-white/5 w-4/5 rounded-none" />
          </div>
        </div>
      </section>

      {/* SECTION 3: Tech Stack */}
      <section className="py-20 px-4 md:px-0 bg-[#0a0a0a]">
        <div className="max-w-[760px] mx-auto animate-pulse">
          <div className="h-3.5 bg-white/5 w-24 mb-8 rounded-none" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 py-5 border-b border-[#262626] last:border-b-0">
                <div className="h-4 bg-white/5 w-32 shrink-0 rounded-none" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 bg-white/5 w-20 rounded-none" />
                  <div className="h-8 bg-white/5 w-24 rounded-none" />
                  <div className="h-8 bg-white/5 w-16 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
