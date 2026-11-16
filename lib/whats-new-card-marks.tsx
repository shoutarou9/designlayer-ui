"use client";

import type { ReactNode } from "react";

/**
 * Same marks and tile treatment as the Framepass integrations cluster.
 * Sizes are scaled so the group fits the what's-new card.
 */
const ASSET = "/dev/framepass-integrations";

const INTEGRATION_ROWS: { name: string; file: string; size: number }[][] = [
  [
    { name: "Zoom", file: "zoom.svg", size: 68 },
    { name: "Figma", file: "figma.svg", size: 80 },
    { name: "Notion", file: "notion.svg", size: 92 },
    { name: "Slack", file: "slack.svg", size: 80 },
    { name: "Drive", file: "drive.svg", size: 68 },
  ],
  [
    { name: "Dropbox", file: "dropbox.svg", size: 76 },
    { name: "Adobe", file: "adobe.svg", size: 84 },
    { name: "Vimeo", file: "vimeo.svg", size: 84 },
    { name: "YouTube", file: "youtube.svg", size: 76 },
  ],
];

/** Framepass tiles are sized for a 500px row. The card row is about half of that. */
const SCALE = 0.46;

export function WhatsNewIntegrationCluster(): ReactNode {
  return (
    <div className="flex w-full max-w-[236px] flex-col items-center gap-[7px]" aria-hidden="true">
      {INTEGRATION_ROWS.map((row, rowIndex) => (
        <ul key={rowIndex} className="m-0 flex list-none items-center justify-center gap-[6px] p-0">
          {row.map((tile) => (
            <li
              key={tile.file}
              title={tile.name}
              className="grid shrink-0 place-items-center overflow-hidden border border-black/10 bg-white shadow-[0_6px_12px_-8px_rgba(0,0,0,0.85)]"
              style={{
                width: Math.round(tile.size * SCALE),
                aspectRatio: "1",
                borderRadius: "22%",
              }}
            >
              <img
                src={`${ASSET}/${tile.file}`}
                alt=""
                draggable={false}
                className="h-[58%] w-[58%] object-contain"
              />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
