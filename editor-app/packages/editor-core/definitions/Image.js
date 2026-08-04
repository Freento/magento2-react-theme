export default {
    label: 'Image',
    category: 'content',
    icon: '🖼',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid'],
    defaultProps: { src: 'https://placehold.co/600x300', alt: '', objectFit: 'cover', objectPosition: 'center center' },
    // Wrapper-level styleFields that don't apply to an image (no text =>
    // no fontSize/textAlign/textColor; borders/corner-radius are rarely
    // useful and clutter the panel) — hidden from Advanced for this block.
    hideStyleFields: [
      'fontFamily',
      'fontSize',
      'textAlign',
      'color',
      'backgroundColor',
      'borderSides',
      'borderStyle',
      'borderColor',
      'borderWidth',
    ],
    propsSchema: {
      src: { label: 'Image', type: 'image', group: 'Image' },
      alt: { label: 'Alt text', type: 'text', placeholder: 'Brand logo', group: 'Advanced' },
      objectFit: {
        label: 'Fit',
        type: 'segmented',
        options: [
          { value: 'cover', label: '', icon: 'FitCover', title: 'Cover — fill box, crop overflow' },
          { value: 'contain', label: '', icon: 'FitContain', title: 'Contain — fit inside, keep ratio' },
          { value: 'fill', label: '', icon: 'FitFill', title: 'Fill — stretch to box' },
          { value: 'none', label: '', icon: 'FitNone', title: 'None — original size' },
        ],
        group: 'Image',
      },
      objectPosition: {
        label: 'Position',
        type: 'segmented',
        cols: 3,
        options: [
          { value: 'left top',       label: '↖', title: 'Top-left' },
          { value: 'center top',     label: '↑', title: 'Top' },
          { value: 'right top',      label: '↗', title: 'Top-right' },
          { value: 'left center',    label: '←', title: 'Left' },
          { value: 'center center',  label: '●', title: 'Center' },
          { value: 'right center',   label: '→', title: 'Right' },
          { value: 'left bottom',    label: '↙', title: 'Bottom-left' },
          { value: 'center bottom',  label: '↓', title: 'Bottom' },
          { value: 'right bottom',   label: '↘', title: 'Bottom-right' },
        ],
        group: 'Image',
      },
    },
};
