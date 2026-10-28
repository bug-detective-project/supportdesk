/** Builds a path that keeps the current search term in the query string. */
export function withSearch(pathname: string, search: string): string {
  return search ? `${pathname}?${new URLSearchParams({ search })}` : pathname;
}
