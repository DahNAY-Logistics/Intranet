import TurndownService from 'turndown';

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
