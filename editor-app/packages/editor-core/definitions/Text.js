export default {
    label: 'Text',
    category: 'content',
    icon: 'T',
    acceptsChildren: false,
    allowedIn: ['page', 'Grid', 'Column'],
    hideStyleFields: ['link', 'fontFamily', 'backgroundColor', 'borderRadius', 'borderSides', 'borderStyle', 'borderColor'],
    spacingSideBySide: true,
    keepFieldOrder: true,
    panelNote: 'To format the text or add a link, type it on the page and select it.',
    defaultProps: {
      html: 'Text block',
      level: 'p',
      color: '',
      textAlign: 'left',
    },
    propsSchema: {
      color: { label: 'Text color', type: 'color', fallback: (props) => ([1, 2, 3, 4].includes(Number(props.level)) ? '#000000' : '#333333'), group: 'Text' },
      textAlign: {
        label: 'Alignment',
        type: 'segmented',
        options: [
          { value: 'left', label: '', icon: 'AlignLeft' },
          { value: 'center', label: '', icon: 'AlignCenter' },
          { value: 'right', label: '', icon: 'AlignRight' },
          { value: 'justify', label: '', icon: 'AlignJustify' },
        ],
        group: 'Text',
      },
      backgroundImage: { label: 'Background', type: 'background', group: 'Advanced' },
      customCss: {
        label: 'Custom styles',
        type: 'customCss',
        group: 'Advanced',
      },
    },
};
