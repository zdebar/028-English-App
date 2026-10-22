import DOMPurify from 'dompurify';
import type { JSX } from 'react';

type SanitizedNoteProps = Readonly<{
  html: string;
  className?: string;
}>;

/** Renders note HTML only after sanitizing it. */
export default function SanitizedNote({ html, className = '' }: SanitizedNoteProps): JSX.Element {
  return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}
