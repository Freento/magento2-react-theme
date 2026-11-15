export const AREAS = [
    {key: 'menu', pageId: '__menu__', label: 'Menu', contained: false},
    {key: 'page', pageId: null, label: 'Page', contained: true},
    {key: 'footer', pageId: '__footer__', label: 'Footer', contained: true},
];

export const PAGE_AREA = 'page';

export const BARE_PAGE_PATHS = ['/__maintenance__'];

export const isBarePage = (page) => BARE_PAGE_PATHS.includes(page?.path);

export const AREA_KEYS = AREAS.map((a) => a.key);
export const GLOBAL_AREAS = AREAS.filter((a) => a.key !== PAGE_AREA);

export const LOOKUP_ORDER = [...GLOBAL_AREAS.map((a) => a.key), PAGE_AREA];

export const areaByKey = (key) => AREAS.find((a) => a.key === key) || null;

export const areaMap = (value) => Object.fromEntries(AREA_KEYS.map((k) => [k, value]));
