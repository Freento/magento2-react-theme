import { ApolloLink } from '@apollo/client';

const REMOTE_MEDIA_RE = /^https?:\/\/[^/]+(\/media\/catalog\/)/i;

export const toLocalMediaUrl = (url) =>
  typeof url === 'string' ? url.replace(REMOTE_MEDIA_RE, '$1') : url;

export const localizeMediaUrls = (value) => {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const item = value[i];
      if (typeof item === 'string') value[i] = toLocalMediaUrl(item);
      else localizeMediaUrls(item);
    }
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const item = value[key];
      if (typeof item === 'string') value[key] = toLocalMediaUrl(item);
      else localizeMediaUrls(item);
    }
  }
  return value;
};

export const mediaLink = new ApolloLink((operation, forward) =>
  forward(operation).map((result) => {
    if (result?.data) localizeMediaUrls(result.data);
    return result;
  }),
);
