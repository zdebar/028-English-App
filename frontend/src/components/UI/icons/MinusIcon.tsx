import Icon, { type IconProps } from "./Icon";

export default function MinusIcon(props: IconProps) {
  return (
    <Icon size={20} {...props}>
      <path
        fillRule="evenodd"
        d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </Icon>
  );
}
