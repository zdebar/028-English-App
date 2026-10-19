import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

export default function ChevronRightIcon(props: Readonly<IconProps>): JSX.Element {
  return (
    <Icon size={24} strokeWidth={1.5} fillColor="none" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </Icon>
  );
}
