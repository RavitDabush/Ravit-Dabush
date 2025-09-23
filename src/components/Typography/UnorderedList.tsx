'use client';

import clsx from 'clsx';

type UnorderedListProps = {
	children: React.ReactNode;
	className?: string;
};

export default function UnorderedList({
	children,
	className = ''
}: UnorderedListProps) {
	return <ul className={clsx('list', className)}>{children}</ul>;
}
