// Stand-in for contexts that have no host override: the storefront footer builds
// its block map as `{...defaultBlocks, NewsletterForm}` (src/App.jsx), so a
// ContactForm dropped into the footer lands here. Pages, the editor canvas and
// the preview iframe all map the block to the host component, which is the one
// that runs the contactUs mutation and hides itself on backends without
// Magento_ContactGraphQl.
//
// Same dashed marker ProductsCarousel uses for the same reason — deliberately
// not a copy of the form, so nobody mistakes a dead replica for the real thing.
export default function ContactForm({ heading = '' }) {
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
      <strong style={{ display: 'block', marginBottom: 6 }}>{heading || 'Contact Form'}</strong>
      <span style={{ fontSize: 13, color: '#64748b' }}>
        Live form renders only on the storefront
      </span>
    </section>
  );
}
