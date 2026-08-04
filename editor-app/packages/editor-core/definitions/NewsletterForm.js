export default {
    label: 'Newsletter Form',
    category: 'domain',
    icon: 'Mail',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid'],
    defaultProps: { buttonText: 'Subscribe', placeholder: 'Enter your email address' },
    propsSchema: {
      buttonText: { label: 'Button text', type: 'text', placeholder: 'Subscribe', group: 'Newsletter' },
      placeholder: { label: 'Input placeholder', type: 'text', placeholder: 'Enter your email address', group: 'Newsletter' },
    },
};
