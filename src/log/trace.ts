import Context from "../parser/context";

export function trace(ctx: Context, loc: string, log: string) {
  console.log(' '.repeat(ctx.size()), loc, log);
}

export function warn(ctx: Context, loc: string, log: string) {
  console.error(' '.repeat(ctx.size()), loc, log);
}