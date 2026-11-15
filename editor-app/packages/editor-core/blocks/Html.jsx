import { useId } from 'react';
import { sanitizeHtml } from '../lib/safeHtml.js';

export default function Html({ html = '', css = '', className = '' }) {
  const rawId = useId();
  const scopeId = `html-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scopedCss = css ? scopeCss(css, `[data-html-block="${scopeId}"]`) : '';
  return (
    <div className={className} data-html-block={scopeId}>
      {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss.replace(/<\/style/gi, '<\\/style') }} />}
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
    </div>
  );
}

function scopeCss(css, prefix) {
  return css.replace(/(^|})\s*([^@}{][^{}]*)\{/g, (match, end, selectorGroup) => {
    const scoped = selectorGroup
      .split(',')
      .map((sel) => `${prefix} ${sel.trim()}`)
      .join(', ');
    return `${end} ${scoped} {`;
  });
}
