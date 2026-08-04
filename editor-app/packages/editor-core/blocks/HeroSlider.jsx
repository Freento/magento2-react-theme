import { useState, useEffect, useRef, useCallback } from 'react';
import { INLINE_EDIT_STYLE } from '../inline-edit-style';

const DEFAULT_BUTTON_COLOR = '#c52327';
const DEFAULT_TEXT_COLOR = '#ffffff';

export default function HeroSlider({ slides = [], autoplay = true, interval = 4000, height = 400, borderRadius = 8, overlayOpacity = 0.3, _editor }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const editable = !!_editor?.isSelected;

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!autoplay || editable || slides.length <= 1) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [autoplay, editable, interval, next, slides.length]);

  const updateSlideField = (field) => (e) => {
    const value = e.currentTarget.innerText;
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

  if (!slides.length) return <div style={{ height, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius }}>No slides</div>;

  const slide = slides[current];
  const buttonColor = slide.buttonColor || DEFAULT_BUTTON_COLOR;
  const textColor = slide.textColor || DEFAULT_TEXT_COLOR;
  const slideBg = slide.backgroundColor || 'transparent';

  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', borderRadius, background: slideBg }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${slide.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'background-image 0.5s',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />

      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: '0 60px' }}>
        <div>
          <h2
            style={{ color: textColor, fontSize: 32, fontWeight: 'bold', marginBottom: 8, maxWidth: 500, ...editableExtras }}
            {...editableTextProps('title')}
          >
            {slide.title}
          </h2>
          {(slide.subtitle || editable) && (
            <p
              style={{ color: textColor, opacity: 0.85, fontSize: 16, marginBottom: 20, maxWidth: 450, ...editableExtras }}
              {...editableTextProps('subtitle')}
            >
              {slide.subtitle}
            </p>
          )}
          {(slide.buttonText || editable) && (
            <a
              href={slide.buttonHref || '#'}
              onClick={editable ? (e) => e.preventDefault() : undefined}
              style={{
                display: 'inline-block',
                background: buttonColor, color: textColor, border: 'none',
                padding: '12px 28px', borderRadius: 4, fontSize: 14,
                fontWeight: 500, cursor: editable ? 'text' : 'pointer', textDecoration: 'none',
                ...editableExtras,
              }}
              {...editableTextProps('buttonText')}
            >
              {slide.buttonText}
            </a>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
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
