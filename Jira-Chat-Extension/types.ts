export interface ComponentSummary {
  name: string;
  type: string;
  path: string;
  summary: string;
  text?: string;
  dependencies: string[];
  metadataUsed: string[];
  methods: string[];
  fixes: string[];
  chunks: {
    chunkId: number;
    text: string;
    summary: string;
  }[];
}

export interface ComponentIndex {
  projectMetadata: {
    projectName: string;
    analyzedAt: string;
    salesforceAPI: string;
  };
  components: Record<string, ComponentSummary>;
  graph: {
    nodes: string[];
    edges: {
      from: string;
      to: string;
    }[];
  };
  searchableMap: Record<string, string>;
}
