import { contentUrl } from 'editor-core/content-url';

export const isExternalHref = (href) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href || '');

export const catUrl = (c) => c.href || `/${c.url_path}${c.url_suffix || ''}`;

export const catState = (c) => {
  if (c.href) {
    if (!c.categoryId) return undefined;
    return { resolved: { type: 'category', id: Number(c.categoryId), path: c.href.replace(/^\/+/, '').split(/[?#]/)[0], name: c.name } };
  }
  return { resolved: { type: 'category', id: Number(c.id), path: `${c.url_path}${c.url_suffix || ''}`, name: c.name } };
};

export const prefetchAttrs = (c) => {
  const id = c.href ? c.categoryId : c.id;
  if (id) return { 'data-prefetch': 'category', 'data-prefetch-id': id };
  if (c.href && c.href !== '#' && !isExternalHref(c.href)) return { 'data-prefetch': 'route' };
  return {};
};

export const manualToCategories = (items) => {
  const toNode = (it, i, prefix) => ({
    id: `${prefix}${i}`,
    name: it.label || '',
    href: it.href || '#',
    image: contentUrl(it.image || ''),
    categoryId: it.categoryId,
    include_in_menu: true,
    position: i,
    children: (it.children || []).map((c, j) => toNode(c, j, `${prefix}${i}-`)),
  });
  return (items || []).map((it, i) => toNode(it, i, 'm'));
};

export const menuItemsOf = (menuDoc) =>
  (menuDoc?.blocks || []).find((b) => b.component === 'Menu')?.props?.items || null;
