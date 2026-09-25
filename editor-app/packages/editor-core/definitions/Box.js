export default {
    label: 'Box',
    category: 'layout',
    icon: 'Square',
    acceptsChildren: true,
    // The link lives in the style layer but belongs with the block's own
    // settings: every block offers one, and an author looks for it in the
    // same place each time.
    regroupStyleFields: { link: 'Box' },
    // A box is a container, so it goes wherever content goes — including
    // inside another box, which is how a card gets an inner panel.
    allowedIn: ['page', 'Grid', 'Box'],
    defaultProps: {
      direction: 'column',
      gap: 8,
      alignX: 'stretch',
      alignY: 'start',
    },
    propsSchema: {
      direction: {
        label: 'Stacking',
        type: 'segmented',
        options: [
          { value: 'column', label: '', icon: 'Rows', title: 'One under another' },
          { value: 'row', label: '', icon: 'ColumnsH', title: 'Side by side' },
        ],
        group: 'Box',
      },
      gap: { label: 'Gap (px)', type: 'number', placeholder: '8', group: 'Box' },
      alignX: {
        label: 'Horizontal alignment',
        type: 'segmented',
        options: [
          { value: 'start', label: '', icon: 'AlignLeft' },
          { value: 'center', label: '', icon: 'AlignCenter' },
          { value: 'end', label: '', icon: 'AlignRight' },
          { value: 'stretch', label: 'Stretch' },
        ],
        group: 'Box',
      },
      alignY: {
        label: 'Vertical alignment',
        type: 'segmented',
        options: [
          { value: 'start', label: '', icon: 'AlignTop' },
          { value: 'center', label: '', icon: 'AlignMiddle' },
          { value: 'end', label: '', icon: 'AlignBottom' },
        ],
        group: 'Box',
      },
    },
};
