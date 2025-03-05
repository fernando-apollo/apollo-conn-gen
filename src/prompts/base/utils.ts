import { KeypressEvent } from '@inquirer/core';
import { stripVTControlCharacters } from 'node:util';

export function isEscapeKey(key: KeypressEvent): boolean {
  return key.name === 'escape';
}

export function getMaxLength(arr: string[]): number {
  return arr.reduce((maxLength, str) => Math.max(maxLength, stripVTControlCharacters(str).length), 0);
}
