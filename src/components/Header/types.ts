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
	| '/theater/tomix'
	| '/theater/hebrew-theater'
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
	| 'tomix'
	| 'hebrew-theater'
	| 'lessin'
	| 'coming-soon';

export type HeaderNavItem = {
	href: HeaderNavHref;
	key: HeaderNavKey;
	children?: HeaderNavItem[];
};

export type HeaderNavVariant = 'desktop' | 'drawer';
