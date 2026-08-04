import { useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';
import { RESOLVE_URL } from '../queries/url';

const RESOLVE_VIA_GRAPHQL = import.meta.env.VITE_URL_RESOLVE_MODE === 'graphql';

const normalizeEntityType = (routeTypeEnum) => routeTypeEnum.toLowerCase().replace(/_/g, '-');

function getAlreadyResolvedPage(requestPath, pageFromClickedLink) {
  if (pageFromClickedLink?.path === requestPath) {
    return pageFromClickedLink;
  }

  if (typeof window !== 'undefined') {
    const resolvedUrlFromServer = window.__INITIAL_DATA__?.resolvedUrl; // { path, data: page }
    if (resolvedUrlFromServer?.path === requestPath) {
      return resolvedUrlFromServer.data;
    }
  }

  return null;
}

function shouldRetryWithHtmlSuffix(requestPath, skip, resolvedUrl) {
  if (skip) return false;
  if (!requestPath) return false;
  if (requestPath.endsWith('.html')) return false;
  if (resolvedUrl.loading) return false;

  return !resolvedUrl.data?.route;
}

function usePageFromGraphql(requestPath, skip) {
  const resolvedUrl = useQuery(RESOLVE_URL, {
    variables: { url: `/${requestPath}` },
    skip: skip || !requestPath,
    fetchPolicy: 'cache-first',
  });
  const retryWithHtmlSuffix = shouldRetryWithHtmlSuffix(requestPath, skip, resolvedUrl);
  const resolvedUrlWithHtml = useQuery(RESOLVE_URL, {
    variables: { url: `/${requestPath}.html` },
    skip: !retryWithHtmlSuffix,
    fetchPolicy: 'cache-first',
  });

  const route = resolvedUrl.data?.route || resolvedUrlWithHtml.data?.route;
  if (route) {
    return {
      loading: false,
      error: null,
      data: { ...route, type: normalizeEntityType(route.type) }
    };
  }

  return {
    loading: resolvedUrl.loading || (retryWithHtmlSuffix && resolvedUrlWithHtml.loading),
    error: resolvedUrl.error || resolvedUrlWithHtml.error || null,
    data: null,
  };
}

export function useResolvedUrl(urlPath) {
  const location = useLocation();
  const requestPath = (urlPath || '').replace(/^\/+/, '');

  const alreadyResolvedPage = getAlreadyResolvedPage(requestPath, location.state?.resolved);
  const pageFromGraphql = usePageFromGraphql(requestPath, Boolean(alreadyResolvedPage) || !RESOLVE_VIA_GRAPHQL);

  if (alreadyResolvedPage) return { loading: false, error: null, data: alreadyResolvedPage };
  if (!RESOLVE_VIA_GRAPHQL) return { loading: false, error: null, data: null };

  return pageFromGraphql;
}
