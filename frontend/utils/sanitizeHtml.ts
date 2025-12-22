export const sanitizeHtml = (input: string): string => {
  if (!input) return '';

  let html = String(input);

  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  html = html.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  html = html.replace(/\son\w+\s*=\s*'[^']*'/gi, '');

  html = html.replace(/\s(href|src)\s*=\s*"javascript:[^"]*"/gi, ' $1="#"');
  html = html.replace(/\s(href|src)\s*=\s*'javascript:[^']*'/gi, " $1='#'");

  html = html.replace(/<iframe\b[^>]*\bsrc\s*=\s*(['"])([^'"]+)\1[^>]*>([\s\S]*?)<\/iframe>/gi, (match, quote, src) => {
    const url = String(src || '').trim();
    if (!/^https?:\/\//i.test(url)) return '';
    return match;
  });

  html = html.replace(/<img\b[^>]*\bsrc\s*=\s*(['"])([^'"]+)\1[^>]*>/gi, (match, quote, src) => {
    const url = String(src || '').trim();
    const ok = /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
    if (!ok) return '';
    return match;
  });

  return html.trim();
};

