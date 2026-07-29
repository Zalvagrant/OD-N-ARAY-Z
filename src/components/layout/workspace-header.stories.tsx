/** S5 · WorkspaceHeader — 03-information-architecture.md §4 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkspaceHeader } from "./workspace-header";
import { Button } from "@/components/ui/button";

const meta: Meta = {
  title: "Layout/WorkspaceHeader",
  parameters: { layout: "padded" },
};
export default meta;

export const BesBilgi: StoryObj = {
  render: () => (
    <WorkspaceHeader
      title="Executive Briefing"
      context="Bugün neye karar vermeliyim?"
      lastSync={new Date(Date.now() - 2 * 60_000).toISOString()}
      actions={
        <Button variant="tertiary" size="sm">
          Yenile
        </Button>
      }
    />
  ),
};

/** Senkron zamanı bilinmiyorsa "az önce" UYDURULMAZ. */
export const SenkronZamaniYok: StoryObj = {
  render: () => <WorkspaceHeader title="Mission Control" lastSync={null} />,
};
