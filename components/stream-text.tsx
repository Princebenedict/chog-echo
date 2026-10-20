// Renders streamed text so each newly arrived word fades in. Earlier words keep their keys, so they never re-animate.
export function StreamText({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) =>
        part.trim() === "" ? (
          part
        ) : (
          <span key={i} className="word-in">
            {part}
          </span>
        ),
      )}
    </>
  );
}
