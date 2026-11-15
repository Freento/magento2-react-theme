export default {
    label: 'Image',
    category: 'content',
    icon: '🖼',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid', 'Column'],
    defaultProps: { src: 'https://placehold.co/600x300', href: '', alt: '', objectFit: 'cover', objectPosition: 'center center' },
    // Wrapper-level styleFields that don't apply to an image (no text =>
    // no fontSize/textAlign/textColor; borders/corner-radius are rarely
    // useful and clutter the panel) — hidden from Advanced for this block.
    hideStyleFields: [
      'link',
      'fontFamily',
      'textAlign',
      'color',
      'backgroundColor',
      'borderSides',
      'borderStyle',
      'borderColor',
    ],
    spacingSideBySide: true,
    keepFieldOrder: true,
    propsSchema: {
      src: { label: 'Image', type: 'image', group: 'Image' },
      href: { label: 'Link', type: 'link', placeholder: '/climbing', group: 'Image' },
      alt: {
        label: 'Alt text',
        type: 'text',
        placeholder: 'Brand logo',
        warnIfEmpty: 'Describe the image for screen readers and search engines.',
        group: 'Image',
      },
      customCss: {
        label: 'Custom styles',
        type: 'customCss',
        group: 'Advanced',
      },
    },
};
