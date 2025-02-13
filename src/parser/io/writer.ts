export default class Writer {
  flush() {
    // throw new Error('Method not implemented.');
  }
  constructor() {}

  write(input: string): Writer {
    // throw new Error('Method not implemented.');
    console.log(input);
    return this;
  }

  append(input: string | null): Writer {
    // throw new Error('Method not implemented.');
    console.log(input);
    return this;
  }
}
