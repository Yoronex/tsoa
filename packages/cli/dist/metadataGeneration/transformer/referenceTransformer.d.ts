import type { TypeAliasDeclaration, Type } from 'typescript';
import { Tsoa } from '@tsoa/runtime';
import { Transformer } from './transformer';
export declare class ReferenceTransformer extends Transformer {
  static merge(referenceTypes: Tsoa.ReferenceType[]): Tsoa.ReferenceType;
  static mergeManyRefObj(many: Tsoa.RefObjectType[]): Tsoa.RefObjectType;
  static mergeRefObj(first: Tsoa.RefObjectType, second: Tsoa.RefObjectType): Tsoa.RefObjectType;
  transform(declaration: TypeAliasDeclaration, refTypeName: string, referencer?: Type): Tsoa.ReferenceType;
}
