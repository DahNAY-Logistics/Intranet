declare module '@tryghost/content-api' {
  export interface GhostPostOrPage {
    id: string;
    slug: string;
    title?: string;
    html?: string | null;
    feature_image?: string | null;
    published_at?: string | null;
    excerpt?: string;
    custom_excerpt?: string;
    reading_time?: number;
    url?: string;
  }

  export interface GhostPagination {
    page: number;
    limit: number;
    pages: number;
    total: number;
    next: number | null;
    prev: number | null;
  }

  export interface GhostPostsOrPages extends Array<GhostPostOrPage> {
    meta: { pagination: GhostPagination };
  }

  export interface GhostBrowseParams {
    fields?: string[];
    include?: string[];
    filter?: string;
    limit?: number | string;
    page?: number;
    order?: string;
  }

  export interface GhostReadParams {
    fields?: string[];
    include?: string[];
  }

  export interface GhostContentAPIOptions {
    url: string;
    version: string;
    key: string;
  }

  export default class GhostContentAPI {
    constructor(options: GhostContentAPIOptions);
    posts: {
      browse(options?: GhostBrowseParams): Promise<GhostPostsOrPages>;
      read(data: { id: string } | { slug: string }, options?: GhostReadParams): Promise<GhostPostOrPage>;
    };
  }
}
