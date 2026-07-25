type Props = {
  text: string;
};

export default function Feature({ text }: Props) {
  return (
    <div className="flex items-center gap-3 text-lg">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        ✓
      </div>

      <span>{text}</span>
    </div>
  );
}
