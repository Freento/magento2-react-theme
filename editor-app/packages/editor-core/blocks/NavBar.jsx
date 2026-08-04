export default function NavBar({ items = [], backgroundColor = '#c52327', textColor = '#ffffff', fontSize = 14, padding = '0 16px', align = 'center' }) {
  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  return (
    <nav style={{
      backgroundColor,
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: justifyMap[align] || 'center',
      padding,
      width: '100%',
    }}>
      <ul style={{ display: 'inline-flex', listStyle: 'none', margin: 0, padding: 0, gap: 0 }}>
        {items.map((item, i) => (
          <li key={i}>
            <a
              href={item.href}
              style={{
                color: textColor,
                textDecoration: 'none',
                padding: '12px 20px',
                display: 'block',
                fontSize,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
