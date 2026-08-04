export default {
    label: 'Slider',
    category: 'domain',
    icon: '⧫',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid'],
    hideStyleFields: ['color', 'backgroundColor', 'borderSides', 'borderStyle', 'borderColor'],
    defaultProps: {
      slides: [
        { title: 'Shinglas shingles from 10.80 BYN', subtitle: 'Best prices on roofing materials', buttonText: 'Learn more', buttonHref: '/catalog', image: 'https://placehold.co/1200x400/c52327/fff?text=Slide+1' },
        { title: 'Hauberk facade tiles', subtitle: 'New collection in stock', buttonText: 'View', buttonHref: '/catalog', image: 'https://placehold.co/1200x400/2563eb/fff?text=Slide+2' },
        { title: 'Insulation 15% off', subtitle: 'Promo until end of month', buttonText: 'To the promo', buttonHref: '/sale', image: 'https://placehold.co/1200x400/16a34a/fff?text=Slide+3' },
      ],
      autoplay: true,
      interval: 4000,
      height: 400,
      overlayOpacity: 0.3,
    },
    propsSchema: {
      slides: {
        label: 'Slides',
        type: 'list',
        group: 'Slider',
        itemSchema: {
          buttonHref: { label: 'Button link', type: 'text' },
          image: { label: 'Image', type: 'image' },
          buttonColor: { label: 'Button color', type: 'color' },
          textColor: { label: 'Text color', type: 'color' },
          backgroundColor: { label: 'Background color', type: 'color' },
        },
      },
      autoplay: {
        label: 'Auto play',
        type: 'boolean',
        inlineNumber: { key: 'interval', placeholder: '4000', suffix: 'ms', width: 84 },
        group: 'Slider',
      },
      interval: { label: 'Time per slide (ms)', type: 'number', placeholder: '4000', group: 'Slider' },
      overlayOpacity: {
        label: 'Overlay strength',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        group: 'Slider',
      },
    },
};
