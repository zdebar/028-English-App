import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

export default function TripleChevronIcon(props: Readonly<IconProps>): JSX.Element {
  return (
    <Icon size={24} strokeWidth={1.5} fillColor="none" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 4.5 5 7.5-5 7.5m6-15 5 7.5-5 7.5m6-15 5 7.5-5 7.5"
      />
    </Icon>
  );
}
