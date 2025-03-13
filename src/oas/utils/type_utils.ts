import { CircularRef } from '../nodes';
import { En } from '../nodes';
import { PropArray } from '../nodes';
import { PropScalar } from '../nodes';
import { IType } from '../nodes';

export class T {
  public static isLeaf(type: IType): boolean {
    return (
      type instanceof PropScalar ||
      type instanceof En ||
      type instanceof CircularRef ||
      (type instanceof PropArray && type.items instanceof PropScalar)
    );
  }

  public static isPropScalar(type: IType): boolean {
    return type instanceof PropScalar;
  }

  public static traverse(node: IType, callback: (node: IType) => void): void {
    const traverseNode = (n: IType): void => {
      callback(n);

      for (const c of n.children) {
        traverseNode(c);
      }
    };

    traverseNode(node);
  }
}
