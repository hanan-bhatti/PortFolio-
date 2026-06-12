import type { TocItem } from "@/lib/tiptap-html";

export default function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav className="glass sticky top-28 hidden max-h-[70vh] overflow-y-auto rounded-2xl p-5 lg:block">
      <p className="mb-3 font-mono text-xs tracking-widest text-zinc-500 uppercase">On this page</p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
            <a href={`#${item.id}`} className="text-zinc-400 transition-colors hover:text-cyan-accent">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
