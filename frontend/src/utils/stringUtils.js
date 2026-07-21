import DOMPurify from 'dompurify';

export const truncateText = (text, maxLen = 72, fallback = '-') => {
  if (text == null || text === '') return fallback;
  const s = String(text);
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
};

export const forumModerationLabel = (status, t) => {
  const key = String(status || '').toUpperCase();
  const map = {
    PENDING: 'admin:forum_status_pending',
    FLAGGED: 'admin:forum_status_flagged',
    APPROVED: 'admin:forum_status_approved',
    REJECTED: 'admin:forum_status_rejected',
  };
  return map[key] && t ? t(map[key]) : key || '-';
};

export const stringifyJson = (value, fallback = '-') => {
  if (value == null) return fallback;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const decodeHtmlEntities = (html) => {
  if (typeof html !== 'string' || !html) return html || '';
  let decoded = html;
  if (/&amp;(lt|gt|quot|#39|nbsp|#160);/gi.test(decoded)) {
    decoded = decoded.replace(/&amp;(lt|gt|quot|#39|nbsp|#160);/gi, '&$1;');
  }
  if (/&lt;(p|div|span|h[1-6]|ul|ol|li|strong|b|em|i|u|a|br|blockquote|img|table|tbody|tr|td|th)\b/gi.test(decoded)) {
    decoded = decoded
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'");
  }
  return decoded;
};

const NBSP_CODE_POINT = 160;
const NBSP_CHAR = String.fromCharCode(NBSP_CODE_POINT);

export const normalizeNbsp = (html) => {
  if (typeof html !== 'string' || !html) return html || '';
  const decoded = decodeHtmlEntities(html);
  return decoded
    .split(NBSP_CHAR)
    .join(' ')
    .replace(/&amp;nbsp;|&nbsp;|&#160;|\u00a0/gi, ' ');
};

const isLightInlineBackground = (bg = '') => {
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  return r >= 220 && g >= 220 && b >= 220;
};

const isDarkNeutralInlineText = (color = '') => {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  const channels = [r, g, b];
  const darkest = Math.min(...channels);
  const lightest = Math.max(...channels);
  return lightest <= 90 && lightest - darkest <= 28;
};

export const normalizeRichTextHtml = (html) => {
  if (!html || typeof html !== 'string') return '';

  let clean = decodeHtmlEntities(html);
  clean = DOMPurify.sanitize(clean);
  clean = normalizeNbsp(clean);

  if (typeof document !== 'undefined') {
    try {
      const container = document.createElement('div');
      container.innerHTML = clean;

      const textWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);
      textNodes.forEach((node) => {
        if (node.nodeValue) {
          node.nodeValue = node.nodeValue.replace(/\u00a0/g, ' ');
        }
      });

      container.querySelectorAll('[style]').forEach((element) => {
        const inlineBg = element.style.background || '';
        const inlineBgColor = element.style.backgroundColor || '';
        const inlineColor = element.style.color || '';

        if (isLightInlineBackground(inlineBg) || isLightInlineBackground(inlineBgColor)) {
          element.style.removeProperty('background');
          element.style.removeProperty('background-color');
        }
        if (isDarkNeutralInlineText(inlineColor)) {
          element.style.removeProperty('color');
        }
      });

      // Preserve empty paragraph lines entered by user
      container.querySelectorAll('p').forEach((p) => {
        const text = p.textContent ? p.textContent.replace(/\s+/g, '') : '';
        if (!text && (!p.children.length || (p.children.length === 1 && p.children[0].tagName === 'BR'))) {
          p.classList.add('ql-empty-line');
          if (!p.innerHTML.trim()) {
            p.innerHTML = '<br>';
          }
        }
      });

      container.querySelectorAll('img').forEach((image) => {
        image.removeAttribute('width');
        image.removeAttribute('height');
        image.style.removeProperty('width');
        image.style.removeProperty('height');
        image.style.removeProperty('min-width');
        image.style.removeProperty('max-width');
        image.style.removeProperty('min-height');
        image.style.removeProperty('max-height');
        image.classList.add('rich-content-image');
      });

      container.querySelectorAll('a').forEach((anchor) => {
        const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
        const anchorTextNodes = [];
        while (walker.nextNode()) anchorTextNodes.push(walker.currentNode);

        anchorTextNodes.forEach((node) => {
          const text = node.nodeValue ?? '';
          if (!/[/-]/.test(text)) return;
          const fragment = document.createDocumentFragment();
          text.split(/([/-])/).forEach((part) => {
            if (!part) return;
            fragment.appendChild(document.createTextNode(part));
            if (part === '/' || part === '-') {
              fragment.appendChild(document.createElement('wbr'));
            }
          });
          node.parentNode?.replaceChild(fragment, node);
        });
      });

      return container.innerHTML;
    } catch {
      return clean;
    }
  }

  return clean;
};

export const prepareRichTextForEdit = (html) => {
  if (typeof html !== 'string' || !html) return '';
  const decoded = decodeHtmlEntities(html);
  return normalizeNbsp(decoded);
};

export const toPlainText = (value) => {
  if (value == null) return '';
  const decodedInput = decodeHtmlEntities(String(value));
  const withoutTags = decodedInput.replace(/<[^>]*>/g, '');
  const decoded = withoutTags
    .replace(/&amp;nbsp;|&nbsp;|&#160;|\u00a0/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
  return decoded.replace(/\s+/g, ' ').trim();
};

export const hasRichTextContent = (value) => {
  if (value == null) return false;
  const str = String(value);
  if (/<img\b/i.test(str)) return true;
  return toPlainText(str).length > 0;
};
