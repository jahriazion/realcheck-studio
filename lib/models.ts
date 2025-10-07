export type UiModel = "rc-mini" | "rc-pro";

export const modelMap: Record<UiModel, { provider: "openai"; model: string }> = {
  "rc-mini": { provider: "openai", model: "gpt-4o-mini" },
  "rc-pro":  { provider: "openai", model: "gpt-4o" },
};
