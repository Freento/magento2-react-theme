export default {
    label: 'Grid',
    category: 'layout',
    icon: 'ColumnsH',
    acceptsChildren: true,
    backgroundOnContent: true,
    allowedIn: ['page'],
    disallowedAncestors: ['Grid'],
    regroupStyleFields: { margin: 'Grid', padding: 'Grid' },
    spacingSideBySide: true,
    hideStyleFields: ['backgroundColor', 'textAlign', 'fontFamily', 'borderRadius', 'borderSides', 'borderStyle', 'borderColor'],
    defaultProps: {
      columns: 3,
      rows: 1,
      rowGap: 16,
      columnGap: 16,
      customCss: '',
      backgroundImage: '',
    },
    propsSchema: {
      // Editable here as well as from the canvas arrows, because the inspector
      // is where a tablet/mobile override gets set (the same field with another
      // device selected writes into `responsive`).
      columns: {
        label: 'Columns',
        type: 'presetNumber',
        presets: [1, 2, 3, 4, 5],
        min: 1,
        max: 12,
        group: 'Grid',
      },
      rows: {
        label: 'Rows',
        type: 'presetNumber',
        presets: [1, 2, 3, 4, 5],
        min: 1,
        max: 50,
        group: 'Grid',
      },
      rowGap: {
        label: 'Gap',
        type: 'numberPair',
        keys: [
          { prop: 'rowGap', icon: 'GapV', title: 'Space between rows' },
          { prop: 'columnGap', icon: 'GapH', title: 'Space between columns' },
        ],
        group: 'Grid',
      },
      backgroundImage: { label: 'Background', type: 'background', group: 'Advanced' },
      customCss: {
        label: 'Custom styles',
        type: 'customCss',
        placeholder: 'align-items: center;\nborder: 1px solid #ddd;',
        group: 'Advanced',
      },
    },
};
