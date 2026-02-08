import React from "react";
import { Composition, Folder } from "remotion";
import { WidgetShowcase } from "./WidgetShowcase";
import { theme } from "./styles/theme";

export const Root: React.FC = () => {
  return (
    <>
      <Folder name="Vertical">
        <Composition
          id="WidgetShowcaseVertical"
          component={WidgetShowcase}
          durationInFrames={theme.timing.total}
          fps={theme.fps}
          width={theme.dimensions.vertical.width}
          height={theme.dimensions.vertical.height}
          defaultProps={{
            hookText: "Add agentic UI\nto your app",
            layout: "vertical" as const,
          }}
        />
      </Folder>
      <Folder name="Horizontal">
        <Composition
          id="WidgetShowcaseHorizontal"
          component={WidgetShowcase}
          durationInFrames={theme.timing.total}
          fps={theme.fps}
          width={theme.dimensions.horizontal.width}
          height={theme.dimensions.horizontal.height}
          defaultProps={{
            hookText: "Add agentic UI\nto your app",
            layout: "horizontal" as const,
          }}
        />
      </Folder>
    </>
  );
};
