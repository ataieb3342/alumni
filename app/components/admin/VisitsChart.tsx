/** Courbe des visiteurs connectés par jour (SVG, sans bibliothèque) */
export function VisitsChart({ series }: { series: { date: string; visitors: number }[] }) {
  const width = 640
  const height = 200
  const padding = { top: 16, right: 12, bottom: 28, left: 28 }
  const max = Math.max(1, ...series.map((point) => point.visitors))
  const x = (index: number) => padding.left + (index / Math.max(1, series.length - 1)) * (width - padding.left - padding.right)
  const y = (value: number) => padding.top + (1 - value / max) * (height - padding.top - padding.bottom)
  const line = series.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point.visitors).toFixed(1)}`).join(' ')
  const area = `${line} L${x(series.length - 1).toFixed(1)},${height - padding.bottom} L${x(0).toFixed(1)},${height - padding.bottom} Z`
  const ticks = [0, Math.round(max / 2), max]
  const label = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const every = Math.ceil(series.length / 7)

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Visiteurs connectés par jour, du ${label(series[0].date)} au ${label(series.at(-1)!.date)}, maximum ${max}`}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="var(--line)" strokeDasharray="3 4" />
            <text x={padding.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="var(--ink-muted)">
              {tick}
            </text>
          </g>
        ))}
        <path d={area} fill="var(--blue)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {series.map((point, index) => (
          <g key={point.date}>
            <circle cx={x(index)} cy={y(point.visitors)} r="3.5" fill="var(--paper-raised)" stroke="var(--blue)" strokeWidth="2">
              <title>
                {label(point.date)} : {point.visitors} visiteur{point.visitors > 1 ? 's' : ''}
              </title>
            </circle>
            {index % every === 0 && (
              <text x={x(index)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--ink-muted)">
                {label(point.date)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="sr-only">
        <table>
          <thead>
            <tr>
              <th>Jour</th>
              <th>Visiteurs</th>
            </tr>
          </thead>
          <tbody>
            {series.map((point) => (
              <tr key={point.date}>
                <td>{label(point.date)}</td>
                <td>{point.visitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}
