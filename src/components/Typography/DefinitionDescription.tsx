'use client';

type DefinitionDescriptionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export default function DefinitionDescription({
  children,
  className,
}: DefinitionDescriptionProps) {
  return (
    <dd className={className}>
      {children}
    </dd>
  );
}
