'use client';

type DefinitionTermProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export default function DefinitionTerm({
  children,
  className,
}: DefinitionTermProps) {
  return (
    <dt className={className}>
      {children}
    </dt>
  );
}
