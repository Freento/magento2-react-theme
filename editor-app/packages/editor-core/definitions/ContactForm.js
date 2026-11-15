export default {
    label: 'Contact Form',
    category: 'domain',
    requiresBackend: true,
    icon: 'MessageSquare',
    acceptsChildren: false,
    // Built-in component: placed by developers in the page JSON. The editor
    // keeps it out of the catalog and lets authors only change its settings.
    system: true,
    // Renders anchors or a form of its own; wrapping it in one more would
    // nest them.
    hideStyleFields: ['link', 'fontFamily', 'textAlign', 'backgroundColor', 'backgroundImage', 'borderRadius', 'borderSides', 'borderStyle', 'borderColor'],
    spacingSideBySide: true,
    allowedIn: ['page', 'Grid', 'Column'],
    defaultProps: { heading: 'Write Us', intro: '', buttonText: 'Submit' },
    propsSchema: {
      heading: { label: 'Heading', type: 'text', placeholder: 'Write Us', group: 'Contact Form' },
      intro: { label: 'Intro text', type: 'text', placeholder: 'Optional', group: 'Contact Form' },
      buttonText: { label: 'Button text', type: 'text', placeholder: 'Submit', group: 'Contact Form' },
      customCss: { label: 'Custom styles', type: 'customCss', group: 'Advanced' },
    },
};
