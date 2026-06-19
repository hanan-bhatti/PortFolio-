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

export default function PageHeader({
  title,
  crumbs,
  action,
  inlineAction = false,
}: {
  title: string;
  crumbs: Crumb[];
  action?: React.ReactNode;
  inlineAction?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
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
        <div className="flex items-center gap-3 flex-nowrap">
          <h1 className="text-2xl font-bold text-white shrink-0">{title}</h1>
          {inlineAction && action ? (
            <div className="shrink-0">{action}</div>
          ) : null}
        </div>
      </div>
      {!inlineAction && action ? action : null}
    </div>
  );
}
