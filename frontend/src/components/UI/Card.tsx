import React from 'react';

type CardProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card-width min-h-card flex flex-col justify-start gap-1 ${className}`}>
      {children}
    </div>
  );
}
