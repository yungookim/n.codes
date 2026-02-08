import { Composition, Folder } from "remotion";
import { DemoVideo } from "./DemoVideo";
import { theme } from "./styles/theme";

const hooks = {
  a: "Your users want features\nyou haven't built yet",
  b: "What if users could\nbuild their own features?",
  c: "Stop building features.\nLet users build their own.",
  d: "Add agentic UI\nto your app",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Vertical">
        <Composition
          id="DemoA"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={theme.dimensions.width}
          height={theme.dimensions.height}
          defaultProps={{ hookText: hooks.a }}
        />
        <Composition
          id="DemoB"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={theme.dimensions.width}
          height={theme.dimensions.height}
          defaultProps={{ hookText: hooks.b }}
        />
        <Composition
          id="DemoC"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={theme.dimensions.width}
          height={theme.dimensions.height}
          defaultProps={{ hookText: hooks.c }}
        />
        <Composition
          id="DemoD"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={theme.dimensions.width}
          height={theme.dimensions.height}
          defaultProps={{ hookText: hooks.d }}
        />
      </Folder>

      <Folder name="Horizontal">
        <Composition
          id="DemoA-H"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={1920}
          height={1080}
          defaultProps={{ hookText: hooks.a }}
        />
        <Composition
          id="DemoB-H"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={1920}
          height={1080}
          defaultProps={{ hookText: hooks.b }}
        />
        <Composition
          id="DemoC-H"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={1920}
          height={1080}
          defaultProps={{ hookText: hooks.c }}
        />
        <Composition
          id="DemoD-H"
          component={DemoVideo}
          durationInFrames={theme.timing.total}
          fps={theme.timing.fps}
          width={1920}
          height={1080}
          defaultProps={{ hookText: hooks.d }}
        />
      </Folder>
    </>
  );
};
