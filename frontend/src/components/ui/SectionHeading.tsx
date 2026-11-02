import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  eyebrowClassName?: string;
  className?: string;
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  eyebrowClassName,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-space-2xl flex flex-col items-center text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-space-xs rounded-full bg-surface-container-high px-space-md py-space-3xs font-label-code-sm text-label-code-sm uppercase tracking-wider text-primary-fixed-dim",
          eyebrowClassName,
        )}
      >
        {eyebrow}
      </div>
      <h2
        id={id}
        className="mb-space-xs font-headline-xl text-headline-xl-mobile tracking-tight text-on-surface md:text-headline-xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          {description}
        </p>
      ) : null}
    </div>
  );
}
