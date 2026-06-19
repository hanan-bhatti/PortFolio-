/**
 * @file app/(public)/photography/loading.tsx
 * @description Loading skeleton page for the Photography route.
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
        overflowX: "hidden",
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
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-20 animate-pulse">
        {/* Header Section */}
        <div className="relative mb-16">
          <div className="h-3.5 bg-white/5 w-28 mb-6 rounded-none" />
          <div className="space-y-3">
            <div className="h-16 bg-white/5 w-2/3 rounded-none" />
            <div className="h-16 bg-white/5 w-1/2 rounded-none" />
          </div>
          <div className="h-8 bg-white/5 w-3/4 mt-8 pl-4 border-l-2 border-amber-500/50 rounded-none" />
        </div>

        {/* Masonry Columns Placeholder Grid */}
        <div className="columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance] space-y-4 md:space-y-6 w-full relative z-10">
          {[360, 480, 400, 320, 440, 380].map((height, index) => (
            <div
              key={index}
              className="break-inside-avoid-column border border-white/10 bg-white/[0.02] flex flex-col rounded-none"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
