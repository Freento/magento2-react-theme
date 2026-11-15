export default {
    label: 'Column',
    icon: 'Columns',
    acceptsChildren: true,
    allowedIn: ['Grid'],
    regroupStyleFields: { link: 'Column' },
    hideStyleFields: ['borderSides', 'borderStyle', 'borderColor', 'backgroundColor', 'backgroundImage', 'fontFamily', 'textAlign', 'borderRadius'],
    spacingSideBySide: true,
    defaultProps: { gap: 8, flex: 1, direction: 'column' },
    propsSchema: {
      direction: {
        label: 'Direction',
        type: 'segmented',
        options: [
          { value: 'column', label: 'Vertical', icon: 'Rows' },
          { value: 'row', label: 'Horizontal', icon: 'ColumnsH' },
        ],
        group: 'Column',
      },
      gap: { label: 'Gap (px)', type: 'number', placeholder: '8', group: 'Column' },
      backgroundImage: { label: 'Background', type: 'background', inStyle: true, group: 'Advanced' },
      customCss: { label: 'Custom styles', type: 'customCss', group: 'Advanced' },
    },
};
