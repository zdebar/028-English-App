import React from 'react';

type HeaderTextProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export default function HeaderText({ children, className = '' }: HeaderTextProps) {
  return <div className={`flex grow justify-start px-4 ${className}`}>{children}</div>;
}
