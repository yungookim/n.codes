import { AbsoluteFill, Sequence } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { theme, sceneStarts } from "./styles/theme";
import { HookScene } from "./scenes/HookScene";
import { AppScene } from "./scenes/AppScene";
import { PanelScene } from "./scenes/PanelScene";
import { ResultScene } from "./scenes/ResultScene";
import { CTAScene } from "./scenes/CTAScene";

// Load fonts
loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
loadJetBrainsMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

type DemoVideoProps = {
  hookText: string;
};

export const DemoVideo: React.FC<DemoVideoProps> = ({ hookText }) => {
  const { fps } = theme.timing;
  const premount = 1 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Scene 1: Hook — Problem statement (0-4s) */}
      <Sequence
        from={sceneStarts.hook}
        durationInFrames={theme.timing.hook}
        premountFor={premount}
      >
        <HookScene hookText={hookText} />
      </Sequence>

      {/* Scene 2: App Shell — CRM dashboard (4-9s) */}
      <Sequence
        from={sceneStarts.app}
        durationInFrames={theme.timing.app}
        premountFor={premount}
      >
        <AppScene />
      </Sequence>

      {/* Scene 3: Panel + Prompt + Status (9-19s) */}
      <Sequence
        from={sceneStarts.panel}
        durationInFrames={theme.timing.panel}
        premountFor={premount}
      >
        <PanelScene />
      </Sequence>

      {/* Scene 4: Result — Invoices table (19-25s) */}
      <Sequence
        from={sceneStarts.result}
        durationInFrames={theme.timing.result}
        premountFor={premount}
      >
        <ResultScene />
      </Sequence>

      {/* Scene 5: CTA — Logo + URL (25-30s) */}
      <Sequence
        from={sceneStarts.cta}
        durationInFrames={theme.timing.cta}
        premountFor={premount}
      >
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
