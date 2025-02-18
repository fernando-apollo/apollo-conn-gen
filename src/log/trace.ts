import Context from "../parser/context";

export function trace(ctx: Context | null, loc: string, log: string) {
  console.log(' '.repeat(ctx?.size() ?? 0), loc, log);
}

export function warn(ctx: Context | null, loc: string, log: string) {
  console.error(' '.repeat(ctx?.size() ?? 0), loc, log);
}