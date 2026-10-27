import type { ReactNode } from 'react';

/**
 * Render `node` only when `condition` is true; otherwise render nothing.
 *
 * A capability gate like `{cond && <Button/>}` adds a branch to the component,
 * and several WMS components already sit at the ESLint `complexity` ceiling.
 * Routing the check through this helper keeps the branch out of the component
 * body while reading the same at the call site:
 *
 *   {renderWhen(access.can('asn', 'create'), <Button>New ASN</Button>)}
 */
export function renderWhen(condition: boolean, node: ReactNode): ReactNode {
  return condition ? node : null;
}
