import { Router } from 'express';
import type { Request, Response } from 'express';

import { blogMessages } from 'core/messages.ts';
import type { ErrorResponse, Serializable } from 'core/types/common.ts';
import type { BlogPostResponse, BlogsResponse } from 'core/types/blogs.ts';

import { requireAuth } from 'src/middleware/require-auth.ts';
import { validate } from '../lib/validate.ts';
import { ghostApi } from '../lib/ghost.ts';
import { htmlToMarkdown } from '../lib/html-to-markdown.ts';
import { blogSlugParamSchema, blogsListQuerySchema } from '../schemas/blogs.ts';

function isGhostNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'response' in error && (error as { response?: { status?: number } }).response?.status === 404;
}

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response<Serializable<BlogsResponse> | ErrorResponse>) => {
  if (!ghostApi) return res.status(503).json({ error: blogMessages.NOT_CONFIGURED });

  const query = validate(blogsListQuerySchema, req.query, res);
  if (!query) return res.status(400).json({ error: blogMessages.INVALID_QUERY });

  try {
    const posts = await ghostApi.posts.browse({
      page: query.page,
      limit: query.pageSize,
      fields: ['id', 'slug', 'title', 'feature_image', 'published_at', 'excerpt', 'custom_excerpt', 'reading_time', 'url'],
    });

    res.json({
      posts,
      page: posts.meta.pagination.page,
      pageSize: posts.meta.pagination.limit,
      totalCount: posts.meta.pagination.total,
      totalPages: posts.meta.pagination.pages,
    });
  } catch {
    res.status(502).json({ error: blogMessages.UPSTREAM_UNAVAILABLE });
  }
});

router.get('/:slug', requireAuth, async (req: Request<{ slug: string }>, res: Response<Serializable<BlogPostResponse> | ErrorResponse>) => {
  if (!ghostApi) return res.status(503).json({ error: blogMessages.NOT_CONFIGURED });

  const params = validate(blogSlugParamSchema, req.params, res);
  if (!params) return res.status(400).json({ error: blogMessages.INVALID_PARAMS });

  try {
    const { html, ...post } = await ghostApi.posts.read(
      { slug: params.slug },
      { fields: ['id', 'slug', 'title', 'html', 'feature_image', 'published_at', 'excerpt', 'custom_excerpt', 'reading_time', 'url'] },
    );

    res.json({ post: { ...post, content: htmlToMarkdown(html ?? '') } });
  } catch (error) {
    if (isGhostNotFound(error)) {
      return res.status(404).json({ error: blogMessages.NOT_FOUND });
    }

    res.status(502).json({ error: blogMessages.UPSTREAM_UNAVAILABLE });
  }
});

export default router;
