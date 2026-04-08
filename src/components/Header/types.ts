export type HeaderNavHref = '/' | '/about' | '/journey';

export type HeaderNavKey = 'home' | 'about' | 'journey';

export type HeaderNavItem = {
	href: HeaderNavHref;
	key: HeaderNavKey;
};

export type HeaderNavVariant = 'desktop' | 'drawer';
