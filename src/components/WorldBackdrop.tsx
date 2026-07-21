/**
 * Full-bleed globe behind the sign-in card. An orthographic graticule scaled
 * past the viewport so it crops off every edge - reads as a planet horizon
 * rather than a logo. Strokes are non-scaling, so the line work stays hairline
 * and precise no matter how large it renders.
 *
 * Geometry (viewBox 600, centre 300,300, radius R):
 *   meridians  = ellipses sharing ry = R, narrowing rx toward the centre line
 *   latitudes  = horizontal chords, half-width = sqrt(R^2 - offset^2)
 */
const R = 240;
const C = 300;

const MERIDIAN_RX = [185, 120, 55];
const LATITUDE_OFFSETS = [60, 120, 180];

const chord = (offset: number) => Math.sqrt(R * R - offset * offset);

export function WorldBackdrop() {
  return (
    <svg
      className="world-backdrop"
      viewBox="0 0 600 600"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="none">
        {/* outer orbit ring - sits beyond the globe, cropped by the viewport */}
        <circle cx={C} cy={C} r={282} className="wb-orbit" />

        {/* globe rim */}
        <circle cx={C} cy={C} r={R} className="wb-rim" />

        {/* meridians */}
        {MERIDIAN_RX.map((rx) => (
          <ellipse key={rx} cx={C} cy={C} rx={rx} ry={R} className="wb-line" />
        ))}
        <line x1={C} y1={C - R} x2={C} y2={C + R} className="wb-line" />

        {/* equator - slightly stronger, gives the horizon its anchor */}
        <line x1={C - R} y1={C} x2={C + R} y2={C} className="wb-equator" />

        {/* latitudes above and below */}
        {LATITUDE_OFFSETS.map((offset) =>
          [-1, 1].map((sign) => {
            const half = chord(offset);
            const y = C + sign * offset;
            return (
              <line
                key={`${offset}:${sign}`}
                x1={C - half}
                y1={y}
                x2={C + half}
                y2={y}
                className="wb-line"
              />
            );
          })
        )}
      </g>
    </svg>
  );
}
