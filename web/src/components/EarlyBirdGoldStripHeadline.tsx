/** Price + cutoff on the gold early-bird strip — amount & date are visually emphasized. */
export function EarlyBirdGoldStripHeadline({
  amount,
  standardAmount,
  until,
  courseTitle,
}: {
  amount: string;
  /** Standard list price — shown struck through before the early-bird price when set. */
  standardAmount?: string;
  until: string;
  courseTitle: string;
}) {
  const spotlight =
    "inline-block rounded-md bg-black/50 px-2 py-0.5 font-black normal-case text-white shadow-[0_2px_12px_rgba(0,0,0,0.35)] ring-1 ring-black/35 antialiased sm:px-2.5 sm:py-1";
  const bridge = "text-background/80 font-extrabold";
  const titleClass = "text-background font-extrabold normal-case";
  const crossed =
    "inline-block font-extrabold normal-case text-background/55 line-through decoration-background/50 decoration-2";

  const std = standardAmount?.trim() ?? "";
  const showWas = Boolean(std && std !== amount.trim());

  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 font-sans text-base font-extrabold uppercase leading-snug tracking-[0.24em] antialiased sm:text-lg sm:font-black">
      {showWas ? (
        <span className={crossed} aria-label={`Was ${std}`}>
          {std}
        </span>
      ) : null}
      <span className={spotlight}>{amount}</span> <span className={bridge}>until</span>{" "}
      <span className={spotlight}>{until}</span> <span className={bridge}>on</span>{" "}
      <span className={titleClass}>{courseTitle}</span>
    </p>
  );
}
