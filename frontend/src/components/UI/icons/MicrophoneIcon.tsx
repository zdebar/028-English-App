import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Heroicons microphone, 24px outline variant.
 */
export default function MicrophoneIcon(props: Readonly<IconProps>): JSX.Element {
  return (
    <Icon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3 0h6m-3.75-15a2.25 2.25 0 0 1 4.5 0v6a2.25 2.25 0 0 1-4.5 0v-6Z"
      />
    </Icon>
  );
}
