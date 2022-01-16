class ValidationError extends Error {
  blockId: string;
  block: object;
  constructor(msg: string, blockId: string = null) {
    super(msg);
    this.blockId = blockId;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
export default ValidationError;
