export default function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
        <span className="gradient-text">{title}</span>
      </h2>
      {subtitle ? <p className="mt-3 text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}
