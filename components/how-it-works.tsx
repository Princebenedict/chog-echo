const STEPS = [
  {
    title: "Traits become a voice",
    body: "Each trait on a Chog nudges five scores: confidence, sarcasm, chaos, warmth and brevity. Those scores shape the writing style.",
  },
  {
    title: "Pick a format",
    body: "Write a post, a reply, a meme with a real picture, or a short story. Strong traits unlock extra meme layouts.",
  },
  {
    title: "Echo and share",
    body: "Download the image, copy the caption, or post straight to X. Holders sign a free message to prove they own the Chog, with no gas.",
  },
];

export function HowItWorks() {
  return (
    <section aria-label="How it works" className="mt-16">
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="glass rounded-3xl p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet/25 font-display text-base font-bold text-electric ring-1 ring-electric/30">
              {i + 1}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-lavender">{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm text-lavender">
        Sample characters use the same engine but are not Chog NFTs. Real Chogs from a connected wallet use their own on-chain traits.
      </p>
    </section>
  );
}
