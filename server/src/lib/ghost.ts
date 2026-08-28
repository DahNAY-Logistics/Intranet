import GhostContentAPI from '@tryghost/content-api';

const { GHOST_API_URL, GHOST_CONTENT_API_KEY } = process.env;

export const ghostApi =
  GHOST_API_URL && GHOST_CONTENT_API_KEY
    ? new GhostContentAPI({
        url: GHOST_API_URL,
        key: GHOST_CONTENT_API_KEY,
        version: 'v6.0',
      })
    : null;
