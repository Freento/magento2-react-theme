export default {
    label: 'HTML',
    category: 'content',
    icon: '⟨⟩',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid', 'Column'],
    hideStyleFields: ['fontFamily', 'textAlign', 'backgroundColor', 'color', 'borderRadius', 'borderSides', 'borderStyle', 'borderColor'],
    defaultProps: { html: '<p>Enter HTML...</p>', css: '' },
    propsSchema: {
      html: { label: 'HTML', type: 'htmlCode', group: 'HTML' },
      css: { label: 'CSS styles', type: 'textarea', placeholder: 'h2 { color: red }', group: 'HTML' },
    },
};
