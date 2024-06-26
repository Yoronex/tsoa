import type { Node, EnumDeclaration, EnumMember } from 'typescript';
import { Tsoa } from '@tsoa/runtime';
import { Transformer } from './transformer';
export declare class EnumTransformer extends Transformer {
  static mergeMany(many: Tsoa.RefEnumType[]): Tsoa.RefEnumType;
  static merge(first: Tsoa.RefEnumType, second: Tsoa.RefEnumType): Tsoa.RefEnumType;
  static transformable(declaration: Node): declaration is EnumDeclaration | EnumMember;
  transform(declaration: EnumDeclaration | EnumMember, enumName: string): Tsoa.RefEnumType;
  private transformDeclaration;
  private transformMember;
}
