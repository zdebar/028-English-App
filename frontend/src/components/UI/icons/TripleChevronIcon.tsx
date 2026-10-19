import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

type TripleChevronIconProps = Readonly<IconProps & { direction: 'left' | 'right' }>;

export default function TripleChevronIcon({ direction, ...props }: TripleChevronIconProps): JSX.Element {
  const path = direction === 'left'
    ? 'm21 4.5-7.5 7.5 7.5 7.5m-6-15L7.5 12l7.5 7.5m-6-15L1.5 12 9 19.5'
    : 'm3 4.5 7.5 7.5L3 19.5m6-15 7.5 7.5L9 19.5m6-15 7.5 7.5L15 19.5';

  return (
    <Icon size={20} strokeWidth={1.5} fillColor="none" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </Icon>
  );
}
