import { Context } from '../context';

export function trace(ctx: Context | null, context: string, message: string): void {
  const count = ctx ? ctx.getStack().length : 0;
  const logMessage = ' '.repeat(count) + `(${count})` + context + ' ' + message;
  console.log(logMessage);
}

export function warn(ctx: Context | null, context: string, message: string): void {
  const count = ctx ? ctx.getStack().length : 0;
  const logMessage = ' '.repeat(count) + context + ' ' + message;
  console.warn(logMessage);
}
