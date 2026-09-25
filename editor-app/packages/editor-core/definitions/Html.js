export default {
    label: 'HTML',
    category: 'content',
    icon: '⟨⟩',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid', 'Box'],
    defaultProps: { html: '<p>Enter HTML...</p>', css: '' },
    propsSchema: {
      html: { label: 'HTML', type: 'textarea', group: 'HTML' },
      css: { label: 'CSS styles', type: 'textarea', placeholder: 'h2 { color: red }', group: 'HTML' },
    },
};
