const leaf = {
  label: { label: 'Label', type: 'text' },
  href: { label: 'Link', type: 'link' },
};

export default {
  label: 'Navigation Menu',
  category: 'domain',
  requiresBackend: true,
  icon: 'Menu',
  acceptsChildren: false,
  system: true,
  allowedIn: ['page', 'Grid', 'Column'],
  hideStyleFields: true,
  defaultProps: {
    items: [
      { label: 'Women', href: '/women.html', children: [] },
      { label: 'Men', href: '/men.html', children: [] },
      { label: 'Gear', href: '/gear.html', children: [] },
    ],
  },
  propsSchema: {
    items: {
      label: 'Menu Items',
      perScreen: false,
      emptyText: 'Add links to build the menu.',
      addLabel: 'Add menu item',
      type: 'list',
      group: 'Menu',
      itemSchema: {
        label: { label: 'Label', type: 'text' },
        href: { label: 'Link', type: 'link' },
        image: { label: 'Image', type: 'image', mobileOnly: true },
        children: {
          label: 'Submenu',
          type: 'list',
          itemSchema: {
            label: { label: 'Label', type: 'text' },
            href: { label: 'Link', type: 'link' },
            children: {
              label: 'Sub-submenu',
              type: 'list',
              itemSchema: { ...leaf },
            },
          },
        },
      },
    },
  },
};
