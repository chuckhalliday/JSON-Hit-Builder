import { useEffect, useState } from 'react'

// Phones get their own layouts (the footer's, and the open part's tabs);
// keep in step with the `max-width: 600px` media queries in the styles.
export const PHONE_QUERY = '(max-width: 600px)';

// Whether a media query matches, following it as the window changes.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}
