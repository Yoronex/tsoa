import type { Token, InterfaceDeclaration, ClassDeclaration } from 'typescript';
import { SyntaxKind } from 'typescript';
import { Tsoa } from '@tsoa/runtime';
import { Transformer } from './transformer';
type OverrideToken = Token<SyntaxKind.QuestionToken> | Token<SyntaxKind.PlusToken> | Token<SyntaxKind.MinusToken> | undefined;
export declare class PropertyTransformer extends Transformer {
  transform(node: InterfaceDeclaration | ClassDeclaration, overrideToken?: OverrideToken): Tsoa.Property[];
  private propertyFromSignature;
  private propertyFromDeclaration;
}
export {};
