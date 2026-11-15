export default {
    label: 'Newsletter Form',
    category: 'domain',
    requiresBackend: true,
    icon: 'Mail',
    acceptsChildren: false,
    // Built-in component: placed by developers in the page JSON. The editor
    // keeps it out of the catalog and lets authors only change its settings.
    system: true,
    // Renders anchors or a form of its own; wrapping it in one more would
    // nest them.
    hideStyleFields: ['link'],
    allowedIn: ['page', 'Grid', 'Column'],
    defaultProps: { buttonText: 'Subscribe', placeholder: 'Enter your email address' },
    propsSchema: {
      buttonText: { label: 'Button text', type: 'text', placeholder: 'Subscribe', group: 'Newsletter' },
      placeholder: { label: 'Input placeholder', type: 'text', placeholder: 'Enter your email address', group: 'Newsletter' },
    },
};
