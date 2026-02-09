import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * Closing Scene (25 seconds)
 *
 * Emotional impact + technical summary + call-to-action
 * "Every parent deserves to be their child's first teacher.
 * Parent-Co-Teacher makes that possible—in any language, at any literacy level."
 */

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Technical recap - brief */}
      <TechnicalRecap frame={frame} fps={fps} />

      {/* Emotional closing statement */}
      <EmotionalClosing frame={frame} fps={fps} />

      {/* App name and branding */}
      <AppBranding frame={frame} fps={fps} />

      {/* Floating particles */}
      <FloatingParticles frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

// Technical recap component
const TechnicalRecap: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const opacity = interpolate(
    frame,
    [0, 20, 5 * fps, 6 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const techPoints = [
    "6+ coordinated Gemini API calls",
    "Vision • Reasoning • Generation • Speech",
    "Stateful • Self-improving • Accessible",
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        textAlign: "center",
      }}
    >
      {techPoints.map((point, index) => {
        const pointOpacity = interpolate(
          frame,
          [index * 15, index * 15 + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={index}
            style={{
              opacity: pointOpacity,
              fontSize: index === 0 ? 32 : 24,
              fontWeight: index === 0 ? 700 : 500,
              color: index === 0 ? "#a78bfa" : "#94a3b8",
              fontFamily: "system-ui, -apple-system, sans-serif",
              marginBottom: 12,
            }}
          >
            {point}
          </div>
        );
      })}
    </div>
  );
};

// Emotional closing component
const EmotionalClosing: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const startFrame = 6 * fps;

  const line1Opacity = interpolate(
    frame,
    [startFrame, startFrame + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const line2Opacity = interpolate(
    frame,
    [startFrame + 2 * fps, startFrame + 2 * fps + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const line1Y = interpolate(
    frame,
    [startFrame, startFrame + 40],
    [40, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const line2Y = interpolate(
    frame,
    [startFrame + 2 * fps, startFrame + 2 * fps + 40],
    [40, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        textAlign: "center",
        maxWidth: 900,
      }}
    >
      {/* Line 1 */}
      <div
        style={{
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
          fontSize: 48,
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1.4,
          marginBottom: 30,
        }}
      >
        Every parent deserves to be
        <br />
        their child's first teacher.
      </div>

      {/* Line 2 - highlighted */}
      <div
        style={{
          opacity: line2Opacity,
          transform: `translateY(${line2Y}px)`,
          fontSize: 42,
          fontWeight: 700,
          background: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1.4,
        }}
      >
        Parent-Co-Teacher makes that possible—
        <br />
        in any language, at any literacy level.
      </div>
    </div>
  );
};

// App branding component
const AppBranding: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const startFrame = 15 * fps;

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 200,
        left: "50%",
        transform: `translateX(-50%) scale(${Math.max(0.8, scale)})`,
        opacity,
        textAlign: "center",
      }}
    >
      {/* Logo/App Name */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          background: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginBottom: 20,
        }}
      >
        Parent-Co-Teacher
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 24,
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        Empowering parents. Transforming learning.
      </div>

      {/* GitHub badge */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 12,
            padding: "12px 24px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#ffffff",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Gemini 3 API Hackathon
          </span>
        </div>
      </div>
    </div>
  );
};

// Floating particles component
const FloatingParticles: React.FC<{ frame: number; fps: number }> = ({
  frame,
}) => {
  return (
    <>
      {[...Array(12)].map((_, i) => {
        const y = interpolate(
          frame,
          [0, 25 * 30], // 25 seconds
          [1920 + i * 150, -300],
          { extrapolateRight: "clamp" }
        );

        const x = Math.sin(frame * 0.02 + i) * 30;
        const size = 6 + (i % 4) * 3;
        const opacity = 0.08 + (i % 3) * 0.04;

        const colors = ["#4ade80", "#a78bfa", "#f97316", "#22d3ee"];
        const color = colors[i % colors.length];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity,
              left: `${5 + i * 8}%`,
              top: y,
              transform: `translateX(${x}px)`,
            }}
          />
        );
      })}
    </>
  );
};
