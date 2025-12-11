import { useMemo } from 'react';

export function useSearchParams() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      org: params.get('org'),
      repo: params.get('repo'),
      catalogOwner: params.get('catalog_owner'),
    };
  }, []);
}
