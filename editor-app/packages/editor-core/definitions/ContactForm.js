export default {
    label: 'Contact Form',
    category: 'domain',
    icon: 'MessageSquare',
    acceptsChildren: false,
    // Renders anchors or a form of its own; wrapping it in one more would
    // nest them.
    hideStyleFields: ['link'],
    allowedIn: ['page', 'Grid', 'Box'],
    defaultProps: { heading: 'Write Us', intro: '', buttonText: 'Submit' },
    propsSchema: {
      heading: { label: 'Heading', type: 'text', placeholder: 'Write Us', group: 'Contact Form' },
      intro: { label: 'Intro text', type: 'text', placeholder: 'Optional', group: 'Contact Form' },
      buttonText: { label: 'Button text', type: 'text', placeholder: 'Submit', group: 'Contact Form' },
    },
};
