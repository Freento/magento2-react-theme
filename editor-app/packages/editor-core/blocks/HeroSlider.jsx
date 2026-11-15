import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { InsideLinkContext } from '../link-context.js';
import { INLINE_EDIT_STYLE } from '../inline-edit-style';
import { contentUrl } from '../lib/contentUrl.js';

const DEFAULT_BUTTON_COLOR = '#c52327';
const DEFAULT_TEXT_COLOR = '#ffffff';

const marginStyle = (margin, fallback) => (margin ? { margin } : fallback);

export default function HeroSlider({ slides = [], autoplay = true, interval = 4000, height = 400, borderRadius = 8, overlayOpacity = 0.3, _style, _editor }) {
  const boxHeight = _style?.height ? '100%' : height;
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const editable = !!_editor?.isSelected;
  const insideLink = useContext(InsideLinkContext);
  const CtaTag = insideLink ? 'span' : 'a';
  const activeSlide = _editor?.activeItem?.key === 'slides' ? _editor.activeItem.index : null;

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!autoplay || editable || slides.length <= 1) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [autoplay, editable, interval, next, slides.length]);

  useEffect(() => {
    if (activeSlide != null && activeSlide < slides.length) setCurrent(activeSlide);
  }, [activeSlide, slides.length]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [current, slides.length]);

  const updateSlideField = (field) => (e) => {
    const value = e.currentTarget.innerText.trim();
    if (value === slides[current]?.[field]) return;
    const nextSlides = slides.map((s, i) => (i === current ? { ...s, [field]: value } : s));
    _editor?.onUpdateProp?.(_editor.blockId, 'slides', nextSlides);
  };
  const editableTextProps = (field) => ({
    contentEditable: editable,
    suppressContentEditableWarning: editable,
    onBlur: editable ? updateSlideField(field) : undefined,
  });
  const editableExtras = editable ? INLINE_EDIT_STYLE : null;

  if (!slides.length) return <div style={{ height: boxHeight, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius }}>No slides</div>;

  const slide = slides[current] || slides[0];
  const buttonColor = slide.buttonColor || DEFAULT_BUTTON_COLOR;
  const textColor = slide.textColor || DEFAULT_TEXT_COLOR;
  const slideBg = slide.backgroundColor || 'transparent';

  return (
    <div style={{ position: 'relative', height: boxHeight, overflow: 'hidden', borderRadius, background: slideBg }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${contentUrl(slide.image)})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'background-image 0.5s',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />

      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: '0 60px' }}>
        <div>
          {slide.title && (
            <h2
              style={{ color: textColor, fontSize: 32, fontWeight: 'bold', maxWidth: 500, ...marginStyle(slide.titleMargin, { marginTop: 0, marginBottom: 8 }), ...editableExtras }}
              {...editableTextProps('title')}
            >
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <p
              style={{ color: textColor, opacity: 0.85, fontSize: 16, maxWidth: 450, ...marginStyle(slide.subtitleMargin, { marginTop: 0, marginBottom: 20 }), ...editableExtras }}
              {...editableTextProps('subtitle')}
            >
              {slide.subtitle}
            </p>
          )}
          {slide.buttonText && (
            <CtaTag
              {...(insideLink ? {} : { href: slide.buttonHref || '#' })}
              onClick={editable ? (e) => e.preventDefault() : undefined}
              style={{
                display: 'inline-block',
                background: buttonColor, color: textColor, border: 'none',
                padding: '12px 28px', borderRadius: 4, fontSize: 14,
                fontWeight: 500, cursor: editable ? 'text' : 'pointer', textDecoration: 'none',
                ...marginStyle(slide.buttonMargin, null),
                ...editableExtras,
              }}
              {...editableTextProps('buttonText')}
            >
              {slide.buttonText}
            </CtaTag>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, pointerEvents: editable ? 'auto' : undefined }}>
        {slides.map((_, i) => {
          const dotActiveColor = (slides[i]?.buttonColor) || DEFAULT_BUTTON_COLOR;
          return (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 24 : 10, height: 10, borderRadius: 5,
                background: i === current ? dotActiveColor : 'rgba(255,255,255,0.6)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
