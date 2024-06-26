import { Tsoa } from '@tsoa/runtime';
import * as ts from 'typescript';
import { MetadataGenerator } from './metadataGenerator';
type UsableDeclaration = ts.InterfaceDeclaration | ts.ClassDeclaration | ts.PropertySignature | ts.TypeAliasDeclaration | ts.EnumMember;
interface Context {
  [name: string]: {
    type: ts.TypeNode;
    name: string;
  };
}
export declare class TypeResolver {
  private readonly typeNode;
  readonly current: MetadataGenerator;
  private readonly parentNode?;
  context: Context;
  readonly referencer?: ts.Type | undefined;
  constructor(typeNode: ts.TypeNode, current: MetadataGenerator, parentNode?: ts.Node | undefined, context?: Context, referencer?: ts.Type | undefined);
  static clearCache(): void;
  resolve(): Tsoa.Type;
  private resolveTypeOperatorNode;
  private resolveIndexedAccessTypeNode;
  private resolveTypeReferenceNode;
  private getLiteralValue;
  private getDesignatedModels;
  private hasFlag;
  private getReferencer;
  private static typeReferenceToEntityName;
  private calcRefTypeName;
  private calcMemberJsDocProperties;
  private calcTypeName;
  private calcTypeReferenceTypeName;
  private getReferenceType;
  private addToLocalReferenceTypeCache;
  private getModelReference;
  private getRefTypeName;
  private createCircularDependencyResolver;
  private nodeIsUsable;
  private getModelTypeDeclarations;
  private getSymbolAtLocation;
  private getModelAdditionalProperties;
  private typeArgumentsToContext;
  private getModelInheritedProperties;
  getNodeDescription(node: UsableDeclaration | ts.PropertyDeclaration | ts.ParameterDeclaration | ts.EnumDeclaration): string | undefined;
  getNodeFormat(node: ts.Node): string | undefined;
  getPropertyName(prop: ts.PropertySignature | ts.PropertyDeclaration | ts.ParameterDeclaration): string;
  getNodeExample(node: ts.Node): any;
  getNodeExtension(node: ts.Node): Tsoa.Extension[];
  private getDecoratorsByIdentifier;
  static getDefault(node: ts.Node): any;
}
export {};
