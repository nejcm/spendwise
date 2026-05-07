export function getShouldShowPersistentTabBar(pathname: string): boolean {
  return pathname !== '/onboarding' && !isModalPath(pathname);
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
