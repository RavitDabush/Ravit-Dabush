'use client';

import clsx from 'clsx';

type OrderedListProps = {
	children: React.ReactNode;
	className?: string;
};

export default function OrderedList({
	children,
	className = ''
}: OrderedListProps) {
	return <ol className={clsx('list-ordered', className)}>{children}</ol>;
}
