import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme, sceneStarts } from "./styles/theme";
import { HookScene } from "./scenes/HookScene";
import { AppScene } from "./scenes/AppScene";
import { PanelScene } from "./scenes/PanelScene";
import { ResultScene } from "./scenes/ResultScene";
import { CTAScene } from "./scenes/CTAScene";

const { fps, timing } = theme;

export const WidgetShowcase: React.FC<{
  hookText: string;
  layout: "vertical" | "horizontal";
}> = ({ hookText, layout }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.heading,
      }}
    >
      {/* Scene 1: Hook text */}
      <Sequence from={sceneStarts.hook} durationInFrames={timing.hook + timing.appReveal}>
        <HookScene hookText={hookText} />
      </Sequence>

      {/* Scene 2: CRM app appears */}
      <Sequence
        from={sceneStarts.appReveal}
        durationInFrames={timing.appReveal + timing.panelOpen + timing.generate + timing.result + timing.glowShow}
        premountFor={fps * 1}
      >
        <AppScene layout={layout} />
      </Sequence>

      {/* Scene 3: Panel opens + prompt typed */}
      <Sequence
        from={sceneStarts.panelOpen}
        durationInFrames={timing.panelOpen + timing.generate + timing.result + timing.glowShow}
        premountFor={fps * 1}
      >
        <PanelScene />
      </Sequence>

      {/* Scene 4: Result view (panel expands, inline render) */}
      <Sequence
        from={sceneStarts.result}
        durationInFrames={timing.result + timing.glowShow}
        premountFor={fps * 1}
      >
        <ResultScene />
      </Sequence>

      {/* Scene 5: CTA */}
      <Sequence
        from={sceneStarts.cta}
        durationInFrames={timing.cta}
        premountFor={fps * 1}
      >
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
