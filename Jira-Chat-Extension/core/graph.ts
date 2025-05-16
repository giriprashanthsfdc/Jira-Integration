import { ComponentIndex } from '../types';

export function updateComponentGraph(index: ComponentIndex): void {
  const nodes = Object.keys(index.components);
  const edges: { from: string; to: string }[] = [];

  for (const [key, comp] of Object.entries(index.components)) {
    for (const dep of comp.dependencies) {
      edges.push({ from: key, to: dep });
    }
  }

  index.graph.nodes = nodes;
  index.graph.edges = edges;
}
