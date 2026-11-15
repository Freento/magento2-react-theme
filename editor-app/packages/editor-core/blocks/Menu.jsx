import { IconChevronDown } from '../overlay/icons.jsx';

export default function Menu({ items = [] }) {
  return (
    <nav style={{ width: '100%', fontFamily: 'inherit' }}>
      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 24, listStyle: 'none', margin: 0, padding: '8px 0' }}>
        {items.map((item, i) => (
          <li key={i} style={{ position: 'relative' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>
              {item.label || 'Item'}
              {(item.children?.length > 0) && <span style={{ marginLeft: 4, color: '#9C9C97', display: 'inline-flex', verticalAlign: 'middle' }}><IconChevronDown /></span>}
            </span>
            {item.children?.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }}>
                {item.children.map((sub, j) => (
                  <li key={j} style={{ fontSize: 12, color: '#6B6B6B', padding: '1px 0' }}>
                    {sub.label || 'Subitem'}
                    {sub.children?.length > 0 && (
                      <span style={{ marginLeft: 6, color: '#C9C9C5' }}>({sub.children.length})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
