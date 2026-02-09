import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { HookScene } from "./components/HookScene";
import { ProblemScene } from "./components/ProblemScene";
import { ScanScene } from "./components/ScanScene";
import { GuideScene } from "./components/GuideScene";
import { MarathonScene } from "./components/MarathonScene";
import { ClosingScene } from "./components/ClosingScene";

/**
 * Parent-Co-Teacher Demo Video
 *
 * Narrative Arc (3 minutes / 180 seconds / 5400 frames @ 30fps):
 *
 * 1. Hook Scene (0-15s / 450 frames) - Meet Sunita story
 * 2. Problem Scene (15-35s / 600 frames) - 250M+ families problem
 * 3. Scan Scene (35-70s / 1050 frames) - App demo: scan & analyze
 * 4. Guide Scene (70-110s / 1200 frames) - Hinglish guide & audio
 * 5. Marathon Scene (110-155s / 1350 frames) - Marathon Agent demo
 * 6. Closing Scene (155-180s / 750 frames) - Impact & call-to-action
 */

export const DemoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <TransitionSeries>
        {/* Scene 1: Opening Hook - Meet Sunita */}
        <TransitionSeries.Sequence durationInFrames={450}>
          <HookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        {/* Scene 2: Problem Statement */}
        <TransitionSeries.Sequence durationInFrames={600}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 20 })}
        />

        {/* Scene 3: Scan & Analyze Demo */}
        <TransitionSeries.Sequence durationInFrames={1050}>
          <ScanScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 25 })}
        />

        {/* Scene 4: Hinglish Guide & Audio */}
        <TransitionSeries.Sequence durationInFrames={1200}>
          <GuideScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        {/* Scene 5: Marathon Agent Demo */}
        <TransitionSeries.Sequence durationInFrames={1350}>
          <MarathonScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        {/* Scene 6: Closing Impact */}
        <TransitionSeries.Sequence durationInFrames={750}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
