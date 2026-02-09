import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * Opening Hook Scene (15 seconds)
 *
 * "Meet Sunita. She works as a house helper in Mumbai.
 * Her daughter Riya goes to an English-medium school.
 * Every evening, Riya brings homework Sunita can't read.
 * Until now."
 */

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text lines with their timing (start frame, duration)
  const lines = [
    { text: "Meet Sunita.", start: 0, duration: 2.5 * fps },
    { text: "She works as a house helper", start: 2.5 * fps, duration: 2 * fps },
    { text: "in Mumbai.", start: 4.5 * fps, duration: 1.5 * fps },
    { text: "Her daughter Riya", start: 6.5 * fps, duration: 2 * fps },
    { text: "goes to an English-medium school.", start: 8.5 * fps, duration: 2.5 * fps },
    { text: "Every evening, Riya brings", start: 11 * fps, duration: 2 * fps },
    { text: "homework Sunita can't read.", start: 13 * fps, duration: 2 * fps },
  ];

  // "Until now" dramatic reveal
  const untilNowStart = 13.5 * fps;
  const untilNowOpacity = interpolate(
    frame,
    [untilNowStart, untilNowStart + fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const untilNowScale = spring({
    frame: frame - untilNowStart,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Background gradient animation
  const gradientRotate = interpolate(frame, [0, 15 * fps], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientRotate}deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Animated text container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
        }}
      >
        {lines.map((line, index) => {
          const lineOpacity = interpolate(
            frame,
            [line.start, line.start + 15, line.start + line.duration - 15, line.start + line.duration],
            [0, 1, 1, 0.3],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const lineY = interpolate(
            frame,
            [line.start, line.start + 20],
            [30, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={index}
              style={{
                opacity: lineOpacity,
                transform: `translateY(${lineY}px)`,
                fontSize: index === 0 ? 72 : 48,
                fontWeight: index === 0 ? 700 : 400,
                color: "#ffffff",
                fontFamily: "system-ui, -apple-system, sans-serif",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {line.text}
            </div>
          );
        })}

        {/* "Until now." dramatic text */}
        <div
          style={{
            opacity: untilNowOpacity,
            transform: `scale(${Math.max(0.8, untilNowScale)})`,
            fontSize: 96,
            fontWeight: 900,
            color: "#4ade80",
            fontFamily: "system-ui, -apple-system, sans-serif",
            textAlign: "center",
            marginTop: 60,
            textShadow: "0 0 40px rgba(74, 222, 128, 0.5)",
          }}
        >
          Until now.
        </div>
      </div>

      {/* Subtle particle effect (simulated with circles) */}
      {[...Array(8)].map((_, i) => {
        const particleY = interpolate(
          frame,
          [0, 15 * fps],
          [1920 + i * 100, -200],
          { extrapolateRight: "clamp" }
        );
        const particleOpacity = 0.1 + (i % 3) * 0.05;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 8 + i * 4,
              height: 8 + i * 4,
              borderRadius: "50%",
              backgroundColor: "#4ade80",
              opacity: particleOpacity,
              left: `${10 + i * 12}%`,
              top: particleY,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
