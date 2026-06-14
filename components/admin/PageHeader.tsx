/**
 * @file components/admin/PageHeader.tsx
 * @description React component for PageHeader.tsx under the admin category.
 * 
 * @exports
 * - Crumb: Type/Interface definition
 * - PageHeader (default): Main React component or function
 */

import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export default function PageHeader({ title, crumbs, action }: { title: string; crumbs: Crumb[]; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-zinc-500">
          {crumbs.map((crumb, i) => (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 ? <span>/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-zinc-300">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-400">{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      {action ?? null}
    </div>
  );
}
