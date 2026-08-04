import { INLINE_EDIT_STYLE } from '../inline-edit-style';

export default function ProductsCarousel({ title = 'New Arrivals', _editor }) {
  const editable = !!_editor?.isSelected;
  return (
    <section
      style={{
        padding: 24,
        border: '1px dashed #c7d2fe',
        borderRadius: 8,
        textAlign: 'center',
        color: '#475569',
        background: '#f8fafc',
      }}
    >
      {editable ? (
        <strong
          style={{
            display: 'block',
            marginBottom: 6,
            color: '#334155',
            ...INLINE_EDIT_STYLE,
          }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const next = e.currentTarget.innerText;
            if (next !== title) _editor.onUpdateProp?.(_editor.blockId, 'title', next);
          }}
        >
          {title}
        </strong>
      ) : (
        <strong style={{ display: 'block', marginBottom: 6, color: '#334155' }}>{title}</strong>
      )}
      <span style={{ fontSize: 13, color: '#64748b' }}>
        Live carousel renders only on the storefront
      </span>
    </section>
  );
}
