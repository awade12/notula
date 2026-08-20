export const PAGE_TREE_DEPTH_INDENT_PX = 14

export function pageTreeDepthPadding(depth: number) {
  return depth > 0 ? { paddingLeft: `${depth * PAGE_TREE_DEPTH_INDENT_PX}px` } : undefined
}
