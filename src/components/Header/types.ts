export type HeaderNavHref = '/' | '/about' | '/journey' | '/style-guide' | '/icons-explorer';

export type HeaderNavKey = 'home' | 'about' | 'journey' | 'style-guide' | 'icons-explorer';

export type HeaderNavItem = {
	href: HeaderNavHref;
	key: HeaderNavKey;
};

export type HeaderNavVariant = 'desktop' | 'drawer';
