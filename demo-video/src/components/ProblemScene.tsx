import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * Problem Statement Scene (20 seconds)
 *
 * - 250M+ Indian families face this exact situation
 * - Parents WANT to help but language barrier stops them
 * - Current solutions assume parent literacy
 */

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Big number reveal animation
  const numberScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const numberOpacity = interpolate(
    frame,
    [0, 30],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Counter animation for the number
  const displayNumber = Math.min(
    250,
    Math.floor(interpolate(frame, [10, fps * 2], [0, 250], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }))
  );

  // Problem points timing
  const points = [
    { text: "Parents WANT to help", emoji: "💪", start: 4 * fps },
    { text: "Language barrier stops them", emoji: "🚧", start: 7 * fps },
    { text: "Current solutions assume literacy", emoji: "📚", start: 10 * fps },
    { text: "Children's learning suffers", emoji: "😔", start: 13 * fps },
  ];

  // Solution teaser
  const solutionStart = 16 * fps;
  const solutionOpacity = interpolate(
    frame,
    [solutionStart, solutionStart + fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1e1e2f 0%, #2d1f3d 100%)",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 60,
        paddingTop: 150,
      }}
    >
      {/* Big number headline */}
      <div
        style={{
          opacity: numberOpacity,
          transform: `scale(${Math.max(0.5, numberScale)})`,
          textAlign: "center",
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
          }}
        >
          {displayNumber}M+
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 600,
            color: "#ffffff",
            marginTop: 20,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Indian families
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "#94a3b8",
            marginTop: 10,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          face this exact situation
        </div>
      </div>

      {/* Problem points */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {points.map((point, index) => {
          const pointOpacity = interpolate(
            frame,
            [point.start, point.start + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const pointX = interpolate(
            frame,
            [point.start, point.start + 25],
            [-100, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={index}
              style={{
                opacity: pointOpacity,
                transform: `translateX(${pointX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 24,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 20,
                padding: "24px 32px",
                borderLeft: "4px solid #ef4444",
              }}
            >
              <span style={{ fontSize: 48 }}>{point.emoji}</span>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  color: "#ffffff",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {point.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Solution teaser */}
      <div
        style={{
          opacity: solutionOpacity,
          position: "absolute",
          bottom: 150,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#4ade80",
            fontFamily: "system-ui, -apple-system, sans-serif",
            textShadow: "0 0 30px rgba(74, 222, 128, 0.4)",
          }}
        >
          We built a solution.
        </div>
      </div>
    </AbsoluteFill>
  );
};
