import type { TypeNode, Node } from 'typescript';
import { SyntaxKind } from 'typescript';
import { Tsoa } from '@tsoa/runtime';
import { Transformer } from './transformer';
export declare class PrimitiveTransformer extends Transformer {
  static resolveKindToPrimitive(syntaxKind: SyntaxKind): ResolvesToPrimitive;
  transform(typeNode: TypeNode, parentNode?: Node): Tsoa.PrimitiveType | undefined;
  private transformNumber;
}
type ResolvesToPrimitive = 'number' | 'string' | 'boolean' | 'void' | 'undefined' | undefined;
export {};
