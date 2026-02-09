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
 * Scan & Analyze Scene (35 seconds)
 *
 * Show the app flow:
 * 1. Home screen with kid profiles
 * 2. Scan homework image
 * 3. Analysis results
 */

export const ScanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone mockup animation
  const phoneScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Section title */}
      <Sequence from={0} durationInFrames={4 * fps}>
        <TitleOverlay
          title="Scan-to-Teach"
          subtitle="Photograph homework. Get teaching scripts instantly."
        />
      </Sequence>

      {/* Phone mockup container */}
      <div
        style={{
          transform: `scale(${Math.max(0.8, phoneScale)})`,
          position: "relative",
        }}
      >
        {/* Phone frame */}
        <div
          style={{
            width: 380,
            height: 780,
            backgroundColor: "#1a1a1a",
            borderRadius: 45,
            padding: 12,
            boxShadow: "0 50px 100px rgba(0, 0, 0, 0.5)",
            border: "3px solid #333",
          }}
        >
          {/* Phone screen */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 35,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Home screen (frames 0-300) */}
            <Sequence from={0} durationInFrames={10 * fps}>
              <ScreenWithImage
                src={staticFile("screenshots/demo-test-home.png")}
                frame={frame}
                fps={fps}
                label="Home Screen"
                description="Kid profiles & Marathon Agent"
              />
            </Sequence>

            {/* Scan screen (frames 300-600) */}
            <Sequence from={10 * fps} durationInFrames={12 * fps}>
              <ScreenWithImage
                src={staticFile("screenshots/demo-test-scan.png")}
                frame={frame - 10 * fps}
                fps={fps}
                label="Scan Homework"
                description="Gemini Vision analyzes content"
              />
            </Sequence>

            {/* Analysis result (frames 600-1050) */}
            <Sequence from={22 * fps} durationInFrames={13 * fps}>
              <ScreenWithImage
                src={staticFile("screenshots/demo-test-home-after-session.png")}
                frame={frame - 22 * fps}
                fps={fps}
                label="Analysis Complete"
                description="Subject, chapter, difficulty detected"
              />
            </Sequence>
          </div>
        </div>

        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: 150,
            height: 30,
            backgroundColor: "#1a1a1a",
            borderRadius: 20,
          }}
        />
      </div>

      {/* Animated callouts */}
      <FeatureCallout
        frame={frame}
        fps={fps}
        start={3 * fps}
        text="Gemini Vision API"
        icon="🔍"
        position={{ top: 350, right: 80 }}
      />

      <FeatureCallout
        frame={frame}
        fps={fps}
        start={15 * fps}
        text="Multi-modal Analysis"
        icon="🧠"
        position={{ top: 550, left: 60 }}
      />

      <FeatureCallout
        frame={frame}
        fps={fps}
        start={25 * fps}
        text="Context Detection"
        icon="📚"
        position={{ bottom: 350, right: 60 }}
      />
    </AbsoluteFill>
  );
};

// Screen with image helper component
const ScreenWithImage: React.FC<{
  src: string;
  frame: number;
  fps: number;
  label: string;
  description: string;
}> = ({ src, frame, fps, label, description }) => {
  const opacity = interpolate(
    frame,
    [0, 15],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity,
        }}
      />
      {/* Label overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          padding: 20,
          opacity,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#4ade80",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 16,
            color: "#94a3b8",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

// Title overlay helper
const TitleOverlay: React.FC<{
  title: string;
  subtitle: string;
}> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 20, 3 * fps, 4 * fps],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const y = interpolate(
    frame,
    [0, 20],
    [50, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 100,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          color: "#94a3b8",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          marginTop: 16,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

// Feature callout helper
const FeatureCallout: React.FC<{
  frame: number;
  fps: number;
  start: number;
  text: string;
  icon: string;
  position: React.CSSProperties;
}> = ({ frame, fps, start, text, icon, position }) => {
  const opacity = interpolate(
    frame,
    [start, start + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame: frame - start,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  return (
    <div
      style={{
        position: "absolute",
        ...position,
        opacity,
        transform: `scale(${Math.max(0.5, scale)})`,
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        border: "2px solid #4ade80",
        borderRadius: 16,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#4ade80",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {text}
      </span>
    </div>
  );
};
