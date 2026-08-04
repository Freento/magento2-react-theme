import { useId } from 'react';

export default function Html({ html = '', css = '', className = '' }) {
  const rawId = useId();
  const scopeId = `html-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scopedCss = css ? scopeCss(css, `[data-html-block="${scopeId}"]`) : '';
  return (
    <div className={className} data-html-block={scopeId}>
      {scopedCss && <style>{scopedCss}</style>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
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
