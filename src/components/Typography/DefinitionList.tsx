'use client';

type DefinitionListProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export default function DefinitionList({
  children,
  className,
}: DefinitionListProps) {
  return (
    <dl className={className}>
      {children}
    </dl>
  );
}
