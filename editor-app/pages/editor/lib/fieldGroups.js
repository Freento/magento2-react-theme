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
    href: 'Link', linkTarget: 'Link',
    fontFamily: 'Typography', fontSize: 'Typography', fontWeight: 'Typography',
    fontStyle: 'Typography', textDecoration: 'Typography',
    letterSpacing: 'Typography', lineHeight: 'Typography',
    color: 'Color', backgroundColor: 'Color', textColor: 'Color',
    borderRadius: 'Border', borderWidth: 'Border', borderStyle: 'Border',
    borderColor: 'Border', borderSides: 'Border',
    width: 'Size', height: 'Size', objectFit: 'Size',
    colSpan: 'Size', rowSpan: 'Size', fullWidth: 'Size',
    padding: 'Spacing', margin: 'Spacing',
    textAlign: 'TextOptions', textTransform: 'TextOptions',
};
export const SUBGROUP_ORDER = ['', 'Link', 'Typography', 'Color', 'Border', 'Size', 'Spacing', 'TextOptions'];
const subGroupOf = (key) => FIELD_SUBGROUP[key] || '';
export const sortBySubGroup = (a, b) => {
    const sa = SUBGROUP_ORDER.indexOf(subGroupOf(a.key));
    const sb = SUBGROUP_ORDER.indexOf(subGroupOf(b.key));
    return sa - sb;
};
