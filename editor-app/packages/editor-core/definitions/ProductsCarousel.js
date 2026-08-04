export default {
    label: 'Products Carousel (Magento)',
    category: 'domain',
    icon: 'GalleryHorizontalEnd',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid'],
    defaultProps: { title: 'New Arrivals', eyebrow: '', categoryId: '2', pageSize: 10, itemsPerSlide: 5 },
    propsSchema: {
      eyebrow: { label: 'Eyebrow', type: 'text', placeholder: 'Just in', group: 'Products Carousel' },
      categoryId: { label: 'Category ID', type: 'text', placeholder: '2', group: 'Products Carousel' },
      pageSize: { label: 'Total number of products', type: 'number', placeholder: '10', group: 'Products Carousel' },
      itemsPerSlide: { label: 'Products per slide', type: 'number', placeholder: '5', group: 'Products Carousel' },
    },
};
