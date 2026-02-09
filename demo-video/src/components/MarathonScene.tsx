import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Sequence,
} from "remotion";

/**
 * Marathon Agent Scene (45 seconds)
 *
 * Show the autonomous planning features:
 * 1. Marathon Agent generates 7-day plan
 * 2. Self-critique quality scoring (Draft: 72 → Final: 89)
 * 3. Adaptive check-in adjusting missions
 */

export const MarathonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0c1222 0%, #1a2744 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Opening statement */}
      <Sequence from={0} durationInFrames={5 * fps}>
        <OpeningStatement />
      </Sequence>

      {/* Main content with phone and explanations */}
      <Sequence from={5 * fps} durationInFrames={40 * fps}>
        <MainContent frame={frame - 5 * fps} fps={fps} />
      </Sequence>

      {/* Quality score animation */}
      <Sequence from={15 * fps} durationInFrames={15 * fps}>
        <QualityScoreAnimation frame={frame - 15 * fps} fps={fps} />
      </Sequence>

      {/* Check-in demo */}
      <Sequence from={30 * fps} durationInFrames={15 * fps}>
        <CheckInDemo frame={frame - 30 * fps} fps={fps} />
      </Sequence>

      {/* Final statement */}
      <Sequence from={38 * fps} durationInFrames={7 * fps}>
        <FinalStatement frame={frame - 38 * fps} fps={fps} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Opening statement
const OpeningStatement: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 20, 4 * fps, 5 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const y = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 600,
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        But Sunita doesn't just need
      </div>
      <div
        style={{
          fontSize: 48,
          fontWeight: 600,
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          marginTop: 10,
        }}
      >
        tonight's homework solved.
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: "#f97316",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          marginTop: 40,
          textShadow: "0 0 30px rgba(249, 115, 22, 0.4)",
        }}
      >
        She needs a plan.
      </div>
    </AbsoluteFill>
  );
};

// Main content with phone
const MainContent: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const phoneScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 60,
        width: "100%",
        height: "100%",
        padding: 60,
      }}
    >
      {/* Phone mockup */}
      <div
        style={{
          transform: `scale(${Math.max(0.7, phoneScale)})`,
        }}
      >
        <div
          style={{
            width: 360,
            height: 740,
            backgroundColor: "#1a1a1a",
            borderRadius: 42,
            padding: 11,
            boxShadow: "0 40px 80px rgba(0, 0, 0, 0.5)",
            border: "3px solid #333",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 34,
              overflow: "hidden",
            }}
          >
            {/* Marathon Agent screen */}
            <Sequence from={0} durationInFrames={20 * fps}>
              <Img
                src={staticFile("screenshots/demo-test-marathon-agent.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: interpolate(frame, [0, 20], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                }}
              />
            </Sequence>

            {/* Check-in result screen */}
            <Sequence from={20 * fps} durationInFrames={20 * fps}>
              <Img
                src={staticFile("screenshots/demo-test-checkin-result.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: interpolate(frame - 20 * fps, [0, 20], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                }}
              />
            </Sequence>
          </div>

          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 18,
              left: "50%",
              transform: "translateX(-50%)",
              width: 135,
              height: 27,
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
            }}
          />
        </div>
      </div>

      {/* Feature list */}
      <FeatureList frame={frame} fps={fps} />
    </div>
  );
};

// Feature list
const FeatureList: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const features = [
    { text: "7-Day Learning Plan", icon: "📅", delay: fps },
    { text: "Personalized Missions", icon: "🎯", delay: 3 * fps },
    { text: "Self-Critique Loop", icon: "🔄", delay: 5 * fps },
    { text: "Quality Verification", icon: "✅", delay: 7 * fps },
    { text: "Adaptive Check-ins", icon: "📈", delay: 9 * fps },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 450,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: "#f97316",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginBottom: 20,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        Marathon Agent
      </div>

      {features.map((feature, index) => {
        const featureOpacity = interpolate(
          frame,
          [feature.delay, feature.delay + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const featureX = interpolate(
          frame,
          [feature.delay, feature.delay + 20],
          [40, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={index}
            style={{
              opacity: featureOpacity,
              transform: `translateX(${featureX}px)`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              backgroundColor: "rgba(249, 115, 22, 0.1)",
              borderRadius: 14,
              padding: "14px 20px",
              border: "1px solid rgba(249, 115, 22, 0.3)",
            }}
          >
            <span style={{ fontSize: 32 }}>{feature.icon}</span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "#ffffff",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              {feature.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Quality score animation
const QualityScoreAnimation: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const opacity = interpolate(
    frame,
    [0, 20, 13 * fps, 15 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  // Animate score from 72 to 89
  const draftScore = 72;
  const finalScore = 89;
  const currentScore = Math.round(
    interpolate(frame, [2 * fps, 8 * fps], [draftScore, finalScore], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const scoreColor =
    currentScore < 80
      ? "#f97316"
      : currentScore < 85
        ? "#eab308"
        : "#4ade80";

  return (
    <div
      style={{
        position: "absolute",
        top: 160,
        right: 80,
        opacity,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 24,
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginBottom: 12,
        }}
      >
        Quality Score
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: scoreColor,
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
          textShadow: `0 0 30px ${scoreColor}40`,
        }}
      >
        {currentScore}
      </div>
      <div
        style={{
          fontSize: 20,
          color: "#64748b",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginTop: 8,
        }}
      >
        {currentScore < finalScore ? "Improving..." : "Self-critique complete"}
      </div>

      {/* Visual indicator */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 24,
            color: "#f97316",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Draft: 72
        </span>
        <span style={{ fontSize: 24, color: "#64748b" }}>→</span>
        <span
          style={{
            fontSize: 24,
            color: "#4ade80",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Final: 89
        </span>
      </div>
    </div>
  );
};

// Check-in demo
const CheckInDemo: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const opacity = interpolate(
    frame,
    [0, 20, 13 * fps, 15 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 200,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        border: "2px solid #4ade80",
        borderRadius: 20,
        padding: "20px 36px",
        maxWidth: 700,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#4ade80",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        "The agent learns and adjusts"
      </div>
      <div
        style={{
          fontSize: 20,
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          marginTop: 12,
        }}
      >
        Adaptive check-ins modify future plans based on completed work
      </div>
    </div>
  );
};

// Final statement
const FinalStatement: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const opacity = interpolate(
    frame,
    [0, 20, 5 * fps, 7 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 100,
        left: "50%",
        transform: `translateX(-50%) scale(${scale})`,
        opacity,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        This isn't a chatbot.
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
          background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginTop: 12,
        }}
      >
        It's an autonomous learning orchestrator.
      </div>
    </div>
  );
};
