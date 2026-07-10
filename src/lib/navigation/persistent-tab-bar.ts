export type PrimaryTabPath = '/' | '/transactions' | '/stats' | '/categories';

const PERSISTABLE_PRIMARY_TAB_PATHS = new Set<string>([
  '/',
  '/transactions',
  '/stats',
  '/categories',
]);

export function getShouldShowPersistentTabBar(pathname: string): boolean {
  return pathname !== '/onboarding' && !isModalPath(pathname);
}

export function getPersistablePrimaryTabPath(pathname: string): PrimaryTabPath | undefined {
  const normalizedPathname = pathname === '' ? '/' : pathname;
  return PERSISTABLE_PRIMARY_TAB_PATHS.has(normalizedPathname)
    ? normalizedPathname as PrimaryTabPath
    : undefined;
}

function isEditRoute(pathname: string, base: string): boolean {
  if (!pathname.startsWith(`/${base}/`) || !pathname.endsWith('/edit')) return false;
  return true;
}

function isModalPath(pathname: string): boolean {
  return pathname === '/transactions/new'
    || pathname === '/accounts/new'
    || isEditRoute(pathname, 'accounts')
    || pathname === '/categories/new'
    || isEditRoute(pathname, 'categories')
    || pathname === '/scheduled/new'
    || pathname === '/stats/global-budget';
}
