/**
 * Decorative globe behind the sign-in card — an orthographic graticule
 * (meridians + latitudes) echoing the C&G Global mark. Deliberately plain
 * line work at low opacity so it reads as texture, never as content.
 */
export function WorldBackdrop() {
  // Latitude chords: half-width = sqrt(r^2 - offset^2) for r = 240.
  const latitudes = [
    { y: 0, half: 240 },
    { y: 80, half: 226 },
    { y: 160, half: 179 },
  ];

  return (
    <svg className="world-backdrop" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <g fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
        {/* rim */}
        <circle cx="300" cy="300" r="240" className="wb-rim" />

        {/* meridians */}
        {[240, 160, 80].map((rx) => (
          <ellipse key={rx} cx="300" cy="300" rx={rx} ry="240" className="wb-line" />
        ))}
        <line x1="300" y1="60" x2="300" y2="540" className="wb-line" />

        {/* latitudes */}
        {latitudes.map(({ y, half }) =>
          y === 0 ? (
            <line key="eq" x1={300 - half} y1="300" x2={300 + half} y2="300" className="wb-line" />
          ) : (
            [-1, 1].map((sign) => (
              <line
                key={`${y}${sign}`}
                x1={300 - half}
                y1={300 + sign * y}
                x2={300 + half}
                y2={300 + sign * y}
                className="wb-line"
              />
            ))
          )
        )}
      </g>
    </svg>
  );
}
