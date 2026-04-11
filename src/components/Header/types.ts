export type HeaderNavHref =
	| '/'
	| '/about'
	| '/journey'
	| '/style-guide'
	| '/icons-explorer'
	| '/theater'
	| '/theater/coming-soon'
	| '/theater/habima'
	| '/theater/cameri'
	| '/theater/lessin';

export type HeaderNavKey =
	| 'home'
	| 'about'
	| 'journey'
	| 'style-guide'
	| 'icons-explorer'
	| 'theater'
	| 'habima'
	| 'cameri'
	| 'lessin'
	| 'coming-soon';

export type HeaderNavItem = {
	href: HeaderNavHref;
	key: HeaderNavKey;
};

export type HeaderNavVariant = 'desktop' | 'drawer';
