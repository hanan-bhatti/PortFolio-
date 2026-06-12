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
      className="glass group block overflow-hidden rounded-2xl transition-shadow hover:glow-cyan"
    >
      <div className="relative h-44 w-full bg-surface-light">
        {post.coverImage ? (
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-white/10">✦</div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{post.readMins} min read</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-cyan-accent">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{post.excerpt}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-cyan-accent/10 px-2.5 py-0.5 text-xs text-cyan-300">
              #{tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
