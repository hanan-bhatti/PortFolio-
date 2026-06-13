import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const settings = await getSiteSettings();
  const photographyEnabled = settings.photography_enabled === "true";

  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      createdAt: true,
    },
  });

  const links = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/about", label: "About" },
    ...(photographyEnabled ? [{ href: "/photography", label: "Photography" }] : []),
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div
      className="w-full min-h-screen relative flex flex-col justify-between"
      style={{
        backgroundColor: "#0a0a0a",
        color: "#fff",
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

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-16 flex-1 flex flex-col items-center justify-center text-center">
        {/* SVG Animated Face */}
        <div className="face-container mb-8">
          <svg className="face" viewBox="0 0 320 380">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={25}>
              <g className="face__eyes" transform="translate(0,112.5)">
                <g transform="translate(15,0)">
                  <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                  <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
                </g>
                <g transform="translate(230,0)">
                  <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                  <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
                </g>
              </g>
              <rect className="face__nose" x="132.5" y="112.5" width={55} height={155} rx={4} ry={4} />
              <g transform="translate(65,334)" strokeDasharray="102 102">
                <path className="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
                <path className="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
              </g>
            </g>
          </svg>
        </div>

        {/* Heading */}
        <p className="font-mono text-[12px] font-semibold tracking-[0.2em] text-green uppercase mb-3">
          Error 404
        </p>
        <h1 className="font-syne font-extrabold text-[clamp(2.5rem,8vw,5rem)] leading-none uppercase mb-4">
          <span style={{ color: "#fff" }}>YOU BROKE</span>
          <br />
          <span style={{ color: "var(--amber)" }}>SOMETHING.</span>
        </h1>
        <p className="max-w-md font-inter text-zinc-400 text-sm italic mb-8 border-l-2 border-amber pl-4 text-left">
          &ldquo;This page doesn&apos;t exist. Or it did and I deleted it. Either way, not my fault.&rdquo;
        </p>

        {/* Stark Brutalist Navigation Strip */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 w-full max-w-2xl">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-5 py-2.5 font-mono text-xs font-semibold tracking-wider uppercase border border-white/10 hover:border-amber-500/40 bg-white/[0.02] hover:bg-amber-500/10 hover:text-amber-400 transition-all duration-200"
              style={{ borderRadius: "0px" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Dynamic Blog Posts Section */}
        {posts.length > 0 && (
          <div className="w-full text-left mt-4 border-t border-white/10 pt-10">
            <h2 className="font-syne font-extrabold text-[11px] uppercase tracking-widest text-zinc-500 mb-6">
              RECENT WRITING
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="p-5 border border-white/10 hover:border-amber-500/40 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-200 group flex flex-col justify-between"
                  style={{ borderRadius: "0px" }}
                >
                  <div>
                    <h3 className="font-syne font-bold text-sm text-white group-hover:text-amber-400 transition-colors leading-tight mb-2">
                      {post.title}
                    </h3>
                    <p className="font-inter text-xs text-zinc-500 line-clamp-3 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-green group-hover:underline">
                    Read article →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Static Footer (Matching style) */}
      <footer className="relative z-10 w-full border-t border-white/[0.05] bg-black/40 py-6 text-center text-xs text-zinc-600 font-mono">
        &copy; {new Date().getFullYear()} Hanan Bhatti · 404 Void Handler
      </footer>

      {/* Styled Block for keyframe animations and SVG face */}
      <style>{`
        .face-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: auto;
          background: transparent;
          color: var(--amber);
        }

        .face-container .face {
          width: 140px;
          height: auto;
          max-height: 180px;
        }

        .face-container .face__eyes,
        .face-container .face__eye-lid,
        .face-container .face__mouth-left,
        .face-container .face__mouth-right,
        .face-container .face__nose,
        .face-container .face__pupil {
          animation: eyes 1s 0.3s forwards;
        }

        .face-container .face__eye-lid,
        .face-container .face__pupil {
          animation-duration: 4s;
          animation-delay: 1.3s;
          animation-iteration-count: infinite;
        }

        .face-container .face__eye-lid {
          animation-name: eye-lid;
        }
        .face-container .face__mouth-left {
          animation-name: mouth-left;
        }
        .face-container .face__mouth-right {
          animation-name: mouth-right;
        }
        .face-container .face__nose {
          animation-name: nose;
        }
        .face-container .face__pupil {
          animation-name: pupil;
        }

        @keyframes eye-lid {
          0%,
          40%,
          45%,
          100% {
            transform: translateY(0);
          }
          42.5% {
            transform: translateY(17.5px);
          }
        }

        @keyframes eyes {
          from {
            transform: translateY(112.5px);
          }
          to {
            transform: translateY(15px);
          }
        }

        @keyframes pupil {
          0%,
          37.5%,
          40%,
          45%,
          87.5%,
          100% {
            stroke-dashoffset: 0;
            transform: translate(0, 0);
          }
          12.5%,
          25%,
          62.5%,
          75% {
            transform: translate(-35px, 0);
          }
          42.5% {
            stroke-dashoffset: 35;
            transform: translate(0, 17.5px);
          }
        }

        @keyframes mouth-left {
          from,
          50% {
            stroke-dashoffset: -102;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes mouth-right {
          from,
          50% {
            stroke-dashoffset: 102;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes nose {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(0, 22.5px);
          }
        }
      `}</style>
    </div>
  );
}
