import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Plus Icon component.
 *
 * @param props - IconProps to customize the icon.
 * @returns - The rendered icon element.
 */
export default function PlusIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} size={20} strokeWidth={1} fillColor="currentColor">
      <path
        fillRule="evenodd"
        d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
        clipRule="evenodd"
      />
    </Icon>
  );
}
