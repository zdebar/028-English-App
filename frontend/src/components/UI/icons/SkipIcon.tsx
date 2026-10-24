import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

export default function SkipIcon(props: Readonly<IconProps>): JSX.Element {
  return (
    <Icon size={20} strokeWidth={1.5} fillColor="none" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(24 0) scale(-1 1)"
        d="m15 15-6 6m0 0-6-6m6 6V9a6 6 0 0 1 12 0v3"
      />
    </Icon>
  );
}
