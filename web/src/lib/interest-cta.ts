/** Primary match CTA copy based on selection count. */
export function primaryMatchLabel(count: number): string {
  if (count <= 0) return "Start Random Match";
  if (count === 1) return "Match Using 1 Interest";
  return `Match Using ${count} Interests`;
}

export function selectionCountLabel(count: number): string {
  if (count === 0) return "No interests selected";
  if (count === 1) return "1 interest selected";
  return `${count} interests selected`;
}
