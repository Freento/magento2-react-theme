import { useEffect, useRef, useContext } from 'react';
import { contentUrl } from '../lib/contentUrl.js';
import { InsideLinkContext } from '../link-context.js';

export default function ImageBlock({
  src = '',
  href = '',
  mobileSrc = '',
  alt = '',
  objectFit = 'cover',
  objectPosition = 'center center',
  borderRadius = '0',
  loadOnHover = false,
  priority = false,
  lazy = !priority || loadOnHover,
  _editor,
}) {
  const insideLink = useContext(InsideLinkContext);
  const deferred = lazy && !mobileSrc && !_editor;
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !el.dataset.src) return undefined;
    const show = () => {
      if (!el.dataset.src) return;
      el.src = el.dataset.src;
      el.removeAttribute('data-src');
    };
    if (!('IntersectionObserver' in window)) {
      show();
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        show();
        io.disconnect();
      }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const imgStyle = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    borderRadius,
  };
  const img = (
    <img
      ref={ref}
      src={deferred ? undefined : contentUrl(src)}
      data-src={deferred ? contentUrl(src) : undefined}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding={lazy ? 'async' : undefined}
      fetchpriority={priority ? 'high' : lazy ? 'low' : undefined}
      style={imgStyle}
    />
  );

  const content = mobileSrc ? (
    <picture>
      <source media="(max-width: 640px)" srcSet={contentUrl(mobileSrc)} />
      {img}
    </picture>
  ) : img;

  if (!href || insideLink) return content;
  return (
    <a
      href={href}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      {content}
    </a>
  );
}
