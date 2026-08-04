export default function NewsletterForm({
  buttonText = 'Subscribe',
  placeholder = 'Enter your email',
}) {
  return (
    <form
      className="nl-form"
      onSubmit={(e) => e.preventDefault()}
      style={{
        display: 'flex',
        gap: 8,
        marginTop: 8,
        maxWidth: 420,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <input
        type="email"
        placeholder={placeholder}
        disabled
        style={{
          flex: 1,
          padding: '12px 14px',
          border: '1px solid #E8E8E5',
          borderRadius: 4,
          background: '#ffffff',
          color: '#111111',
          fontSize: 14,
        }}
      />
      <button
        type="button"
        disabled
        style={{
          padding: '12px 20px',
          background: '#111111',
          color: '#ffffff',
          border: '1px solid #111111',
          borderRadius: 4,
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {buttonText}
      </button>
    </form>
  );
}
