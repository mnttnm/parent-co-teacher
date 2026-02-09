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
 * Guide Scene (40 seconds)
 *
 * Show the Hinglish teaching guide:
 * 1. Chapter guide view
 * 2. Audio playing feature (key emotional moment)
 * 3. "This is what Sunita reads aloud to Riya"
 */

export const GuideScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Title: "The Magic" */}
      <Sequence from={0} durationInFrames={5 * fps}>
        <MagicTitle />
      </Sequence>

      {/* Phone mockup with guide screens */}
      <div
        style={{
          position: "relative",
          display: "flex",
          gap: 60,
          alignItems: "center",
        }}
      >
        {/* Phone mockup */}
        <PhoneMockup frame={frame} fps={fps} />

        {/* Side explanation panel */}
        <Sequence from={5 * fps} durationInFrames={35 * fps}>
          <ExplanationPanel frame={frame - 5 * fps} fps={fps} />
        </Sequence>
      </div>

      {/* Hinglish text example floating */}
      <Sequence from={15 * fps} durationInFrames={20 * fps}>
        <HinglishTextBubble frame={frame - 15 * fps} fps={fps} />
      </Sequence>

      {/* Audio waveform animation */}
      <Sequence from={20 * fps} durationInFrames={15 * fps}>
        <AudioWaveform frame={frame - 20 * fps} fps={fps} />
      </Sequence>

      {/* Emotional quote */}
      <Sequence from={30 * fps} durationInFrames={10 * fps}>
        <EmotionalQuote />
      </Sequence>
    </AbsoluteFill>
  );
};

// Phone mockup component
const PhoneMockup: React.FC<{ frame: number; fps: number }> = ({
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
        transform: `scale(${Math.max(0.7, phoneScale)}) translateX(-50px)`,
        position: "absolute",
        left: 80,
      }}
    >
      <div
        style={{
          width: 340,
          height: 700,
          backgroundColor: "#1a1a1a",
          borderRadius: 40,
          padding: 10,
          boxShadow: "0 40px 80px rgba(0, 0, 0, 0.4)",
          border: "3px solid #333",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 32,
            overflow: "hidden",
          }}
        >
          {/* Chapter guide screenshot */}
          <Sequence from={0} durationInFrames={15 * fps}>
            <Img
              src={staticFile("screenshots/demo-test-chapter-guide.png")}
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

          {/* Audio playing screenshot */}
          <Sequence from={15 * fps} durationInFrames={25 * fps}>
            <Img
              src={staticFile("screenshots/demo-test-audio-playing.png")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: interpolate(frame - 15 * fps, [0, 20], [0, 1], {
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
            width: 130,
            height: 26,
            backgroundColor: "#1a1a1a",
            borderRadius: 15,
          }}
        />
      </div>
    </div>
  );
};

// Magic title component
const MagicTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 20, 4 * fps, 5 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          fontSize: 72,
          fontWeight: 900,
          background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        Now the magic.
      </div>
      <div
        style={{
          fontSize: 36,
          color: "#94a3b8",
          marginTop: 20,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        Hinglish teaching scripts
      </div>
    </AbsoluteFill>
  );
};

// Explanation panel
const ExplanationPanel: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const features = [
    { text: "Natural Hinglish", delay: 0, icon: "🗣️" },
    { text: "Not awkward translations", delay: fps, icon: "✨" },
    { text: "Parent-friendly context", delay: 2 * fps, icon: "👨‍👩‍👧" },
    { text: "Audio playback", delay: 3 * fps, icon: "🔊" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 500,
      }}
    >
      {features.map((feature, index) => {
        const featureOpacity = interpolate(
          frame,
          [feature.delay, feature.delay + 20],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const featureX = interpolate(
          frame,
          [feature.delay, feature.delay + 25],
          [50, 0],
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
              backgroundColor: "rgba(168, 85, 247, 0.1)",
              borderRadius: 16,
              padding: "16px 24px",
              border: "1px solid rgba(168, 85, 247, 0.3)",
            }}
          >
            <span style={{ fontSize: 36 }}>{feature.icon}</span>
            <span
              style={{
                fontSize: 28,
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

// Hinglish text bubble
const HinglishTextBubble: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const opacity = interpolate(
    frame,
    [0, 20, 18 * fps, 20 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const y = interpolate(frame, [0, 30], [30, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 280,
        left: "50%",
        transform: `translateX(-50%) translateY(${y}px)`,
        opacity,
        backgroundColor: "rgba(74, 222, 128, 0.15)",
        border: "2px solid #4ade80",
        borderRadius: 20,
        padding: "24px 36px",
        maxWidth: 800,
      }}
    >
      <div
        style={{
          fontSize: 28,
          color: "#4ade80",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        "Riya ko bolo: story ka main character kaun hai?"
      </div>
      <div
        style={{
          fontSize: 18,
          color: "#94a3b8",
          textAlign: "center",
          marginTop: 12,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        This is how a teacher would actually speak.
      </div>
    </div>
  );
};

// Audio waveform animation
const AudioWaveform: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const opacity = interpolate(
    frame,
    [0, 15, 13 * fps, 15 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 150,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 32, marginRight: 16 }}>🔊</span>
      {[...Array(20)].map((_, i) => {
        const height = interpolate(
          Math.sin(frame * 0.3 + i * 0.5),
          [-1, 1],
          [15, 50]
        );

        return (
          <div
            key={i}
            style={{
              width: 6,
              height,
              backgroundColor: "#4ade80",
              borderRadius: 3,
            }}
          />
        );
      })}
    </div>
  );
};

// Emotional quote
const EmotionalQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 20, 8 * fps, 10 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 60,
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          fontSize: 36,
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        "This is what Sunita reads aloud to Riya."
      </div>
    </AbsoluteFill>
  );
};
