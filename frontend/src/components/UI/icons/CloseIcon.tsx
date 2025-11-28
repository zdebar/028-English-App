import Icon, { type IconProps } from "./Icon";

export default function CloseIcon(props: IconProps) {
  return (
    <Icon size={32} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </Icon>
  );
}
