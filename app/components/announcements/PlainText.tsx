import { parsePlainText } from '@/lib/richtext'

/** Texte saisi par un membre : paragraphes et listes à puces, sans HTML */
export function PlainText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`prose-cahier ${className ?? ''}`}>
      {parsePlainText(text).map((block, index) =>
        block.kind === 'list' ? (
          <ul key={index}>
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            {block.lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        )
      )}
    </div>
  )
}
