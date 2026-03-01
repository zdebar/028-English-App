import type { JSX } from 'react';

interface NotificationTextProps {
  text: string;
  className?: string;
}

export default function NotificationText({ text, className }: NotificationTextProps): JSX.Element {
  return <p className={`font-headings text-center text-xl ${className}`}>{text}</p>;
}
