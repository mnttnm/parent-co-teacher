import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";

// Video specifications
// 3 minutes = 180 seconds = 5400 frames at 30fps
// Mobile-first: 9:16 aspect ratio (1080x1920) for hackathon demo

export const RemotionRoot = () => {
  return (
    <Composition
      id="DemoVideo"
      component={DemoVideo}
      durationInFrames={5400}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  );
};
