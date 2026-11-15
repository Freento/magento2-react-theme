export function groupFields(entries, getGroup) {
    const out = new Map();
    entries.forEach((entry) => {
        const g = getGroup(entry) || 'Advanced';
        if (!out.has(g)) out.set(g, []);
        out.get(g).push(entry);
    });
    return out;
}

export const FIELD_SUBGROUP = {
    href: 'Link', linkTarget: 'Link', newTab: 'Link',
    fontFamily: 'Typography', fontSize: 'Typography', fontWeight: 'Typography',
    fontStyle: 'Typography', textDecoration: 'Typography',
    letterSpacing: 'Typography', lineHeight: 'Typography',
    color: 'Color', backgroundColor: 'Color', backgroundImage: 'Color', textColor: 'Color',
    borderRadius: 'Border', borderWidth: 'Border', borderStyle: 'Border',
    borderColor: 'Border', borderSides: 'Border',
    width: 'Size', height: 'Size', objectFit: 'Size',
    fullWidth: 'Size',
    hidden: 'Visibility',
    customCss: 'TextOptions',
    padding: 'Spacing', margin: 'Spacing', rowGap: 'Spacing',
    textAlign: 'TextOptions', textTransform: 'TextOptions',
};
export const SUBGROUP_ORDER = ['', 'Visibility', 'Link', 'Typography', 'Color', 'Border', 'Size', 'Spacing', 'TextOptions'];
const STYLE_FIELD_SUBGROUP = {textAlign: 'Typography'};
const subGroupOf = (entry, overrides) =>
    overrides?.[entry.key] || (entry.source === 'style' && STYLE_FIELD_SUBGROUP[entry.key]) || FIELD_SUBGROUP[entry.key] || '';
export const sortBySubGroup = (a, b, overrides) => {
    const sa = SUBGROUP_ORDER.indexOf(subGroupOf(a, overrides));
    const sb = SUBGROUP_ORDER.indexOf(subGroupOf(b, overrides));
    return sa - sb;
};
