export default class Link {
  source: string;
  target: string;
  sourcePort: string;
  targetPort: string;

  constructor({
    source,
    target,
    sourcePort,
    targetPort,
  }: {
    source: string;
    target: string;
    sourcePort: string;
    targetPort: string;
  }) {
    this.source = source;
    this.target = target;
    this.sourcePort = sourcePort;
    this.targetPort = targetPort;
  }
  toJson() {
    return {
      source: this.source,
      target: this.target,
      sourcePort: this.sourcePort,
      targetPort: this.targetPort,
    };
  }
}
