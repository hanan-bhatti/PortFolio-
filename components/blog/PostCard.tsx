import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export interface PostCardData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  createdAt: string;
  readMins: number;
}

export default function PostCard({ post }: { post: PostCardData }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="relative h-[280px] w-full overflow-hidden block border border-border rounded-none bg-bg-elevated text-left group transition-all duration-200 hover:border-amber"
    >
      {/* Cover Image or Fallback */}
      <div className="absolute inset-0 w-full h-full">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover absolute inset-0 w-full h-full grayscale-[20%] transition-all duration-400 ease-out group-hover:grayscale-0 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-bg-elevated text-5xl font-bold text-white/5 uppercase font-syne">
            {post.title.charAt(0)}
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.1) 100%)",
        }}
      />

      {/* Top-right Arrow */}
      <span className="absolute top-4 right-4 z-10 font-syne font-bold text-[1.2rem] text-amber opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        ↗
      </span>

      {/* Overlaid Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col justify-end pointer-events-none">
        {/* Date · Read Time */}
        <div className="flex items-center gap-2 font-inter font-normal text-[11px] text-white/55 mb-2">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{post.readMins} min read</span>
        </div>

        {/* Title */}
        <h3 className="font-syne font-bold text-[1.1rem] text-white leading-[1.3] line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="font-inter font-normal text-[12px] text-white/60 mt-[0.4rem] line-clamp-2">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-[0.75rem]">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="font-inter font-medium text-[10px] text-amber"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
