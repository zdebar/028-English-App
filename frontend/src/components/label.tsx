export default function Label({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <p className={`inline-block w-25 shrink-0 pl-2 ${className}`}>{text}</p>
  );
}
