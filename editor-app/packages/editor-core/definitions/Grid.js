export default {
    label: 'Grid',
    category: 'layout',
    icon: 'ColumnsH',
    acceptsChildren: true,
    allowedIn: ['page'],
    disallowedAncestors: ['Grid'],
    defaultProps: {
      direction: 'grid',
      columns: 3,
      rows: 0,
      rowGap: 16,
      columnGap: 16,
      alignItems: 'stretch',
      justifyItems: 'stretch',
    },
    propsSchema: {
      direction: {
        label: 'Layout',
        type: 'segmented',
        options: [
          { value: 'grid', label: 'Grid', icon: 'Square' },
          { value: 'column', label: 'Stacked', icon: 'Rows' },
          { value: 'row', label: 'In a row', icon: 'ColumnsH' },
        ],
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
      alignItems: {
        label: 'Vertical alignment',
        type: 'segmented',
        options: [
          { value: 'start', label: '', icon: 'AlignTop' },
          { value: 'center', label: '', icon: 'AlignMiddle' },
          { value: 'end', label: '', icon: 'AlignBottom' },
          { value: 'stretch', label: 'Stretch' },
        ],
        group: 'Grid',
      },
      justifyItems: {
        label: 'Horizontal alignment',
        type: 'segmented',
        options: [
          { value: 'start', label: '', icon: 'AlignLeft' },
          { value: 'center', label: '', icon: 'AlignCenter' },
          { value: 'end', label: '', icon: 'AlignRight' },
          { value: 'stretch', label: 'Stretch' },
        ],
        group: 'Grid',
      },
    },
};
