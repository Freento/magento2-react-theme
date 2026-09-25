export default {
    label: 'Products Carousel (Magento)',
    category: 'domain',
    icon: 'GalleryHorizontalEnd',
    acceptsChildren: false,
    // Renders anchors or a form of its own; wrapping it in one more would
    // nest them.
    hideStyleFields: ['link'],
    allowedIn: ['page', 'Grid', 'Box'],
    defaultProps: {
      title: 'New Arrivals',
      eyebrow: '',
      source: 'category',
      categoryId: '2',
      skus: [],
      pageSize: 10,
      itemsPerSlide: 5,
    },
    propsSchema: {
      eyebrow: { label: 'Eyebrow', type: 'text', placeholder: 'Just in', group: 'Products Carousel' },
      // A category slice and a hand-picked list are two different things, and
      // the rest of the panel follows this choice.
      source: {
        label: 'Products from',
        type: 'segmented',
        options: [
          { value: 'category', label: 'Category', title: 'Everything in one Magento category' },
          { value: 'skus', label: 'Chosen list', title: 'Named products, in the order you list them' },
        ],
        group: 'Products Carousel',
      },
      categoryId: {
        label: 'Category ID',
        type: 'text',
        placeholder: '2',
        showWhen: { prop: 'source', equals: 'category' },
        group: 'Products Carousel',
      },
      skus: {
        label: 'Products',
        type: 'list',
        itemSchema: { sku: { label: 'SKU', type: 'text' } },
        showWhen: { prop: 'source', equals: 'skus' },
        group: 'Products Carousel',
      },
      pageSize: {
        label: 'Total number of products',
        type: 'number',
        placeholder: '10',
        // A chosen list is as long as it is.
        showWhen: { prop: 'source', equals: 'category' },
        group: 'Products Carousel',
      },
      itemsPerSlide: { label: 'Products per slide', type: 'number', placeholder: '5', group: 'Products Carousel' },
    },
};
