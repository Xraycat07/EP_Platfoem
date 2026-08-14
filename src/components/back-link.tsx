import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft transition hover:text-foreground"
    >
      ← {label}
    </Link>
  );
}
