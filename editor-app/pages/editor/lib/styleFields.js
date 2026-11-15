const hasBorderLine = (style) => !!style?.borderStyle && style.borderStyle !== 'none';
const borderSidesOf = (style) =>
    style?.borderSides === 'none' || !hasBorderLine(style) ? 'none' : style.borderSides || 'all';
const hasBorder = (style) => borderSidesOf(style) !== 'none';

export const styleFields = [
    {key: 'fullWidth', label: 'Stretch to full screen width', type: 'boolean', group: 'Advanced'},
    // Per-screen visibility. Set while the tablet/mobile device is selected it
    // writes a responsive override, so one block can be desktop-only.
    {key: 'hidden', label: 'Hide on this screen', type: 'boolean', group: 'Advanced'},
    {key: 'margin', label: 'Margin', type: 'spacing', group: 'Advanced'},
    {key: 'padding', label: 'Padding', type: 'spacing', group: 'Advanced'},
    {key: 'backgroundColor', label: 'Background color', type: 'color', group: 'Advanced'},
    {key: 'backgroundImage', label: 'Background image', type: 'image', containerOnly: true, group: 'Advanced'},
    {key: 'link', label: 'Link', type: 'link', placeholder: '/women.html', group: 'Advanced'},
    {
        key: 'fontFamily',
        label: 'Font',
        type: 'fontFamily',
        inlineNumber: {key: 'fontSize', placeholder: '14', suffix: 'px', width: 64},
        group: 'Advanced',
    },
    {
        key: 'textAlign',
        label: 'Text alignment',
        type: 'segmented',
        options: [
            {value: 'left', label: '', icon: 'AlignLeft', title: 'Left'},
            {value: 'center', label: '', icon: 'AlignCenter', title: 'Center'},
            {value: 'right', label: '', icon: 'AlignRight', title: 'Right'},
            {value: 'justify', label: '', icon: 'AlignJustify', title: 'Justify'},
        ],
        group: 'Advanced',
    },
    {key: 'borderRadius', label: 'Corner radius', type: 'cornerRadius', group: 'Advanced'},
    {
        key: 'borderSides',
        label: 'Border',
        type: 'segmented',
        options: [
            {value: 'none', label: '', icon: 'LineNone', title: 'No border'},
            {value: 'all', label: '', icon: 'BorderAll', title: 'All sides'},
            {value: 'top', label: '', icon: 'BorderTop', title: 'Top'},
            {value: 'bottom', label: '', icon: 'BorderBottom', title: 'Bottom'},
            {value: 'left', label: '', icon: 'BorderLeft', title: 'Left'},
            {value: 'right', label: '', icon: 'BorderRight', title: 'Right'},
        ],
        getValue: borderSidesOf,
        toPatch: (value, style) =>
            value === 'none'
                ? {borderSides: 'none'}
                : {
                    borderSides: value,
                    borderStyle: hasBorderLine(style) ? style.borderStyle : 'solid',
                    borderWidth: style?.borderWidth === '' || style?.borderWidth == null ? 1 : style.borderWidth,
                },
        group: 'Advanced',
    },
    {
        key: 'borderStyle',
        label: 'Line',
        type: 'segmented',
        options: [
            {value: 'solid', label: '', icon: 'LineSolid', title: 'Solid'},
            {value: 'dashed', label: '', icon: 'LineDashed', title: 'Dashed'},
            {value: 'dotted', label: '', icon: 'LineDotted', title: 'Dotted'},
            {value: 'double', label: '', icon: 'LineDouble', title: 'Double'},
        ],
        inlineNumber: {key: 'borderWidth', placeholder: '1', suffix: 'px', width: 56},
        showIf: hasBorder,
        group: 'Advanced',
    },
    {key: 'borderColor', label: 'Line color', type: 'color', fallback: '#000000', showIf: hasBorder, group: 'Advanced'},
];
