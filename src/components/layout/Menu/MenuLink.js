import React from 'react';
import { Link } from 'react-router-dom';
import { catState, catUrl, isExternalHref, prefetchAttrs } from './menuItems';

const MenuLink = ({ item, children, ...rest }) => {
  const to = catUrl(item);
  if (to === '#') return <span {...rest}>{children}</span>;
  if (isExternalHref(to)) return <a href={to} {...rest}>{children}</a>;
  return <Link to={to} state={catState(item)} {...prefetchAttrs(item)} {...rest}>{children}</Link>;
};

export default MenuLink;
