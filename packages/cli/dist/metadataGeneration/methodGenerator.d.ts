import * as ts from 'typescript';
import { MetadataGenerator } from './metadataGenerator';
import { Tsoa } from '@tsoa/runtime';
type HttpMethod = 'options' | 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';
export declare class MethodGenerator {
  private readonly node;
  private readonly current;
  private readonly commonResponses;
  private readonly parentPath?;
  private readonly parentTags?;
  private readonly parentSecurity?;
  private readonly isParentHidden?;
  protected method?: HttpMethod;
  protected path?: string;
  private produces?;
  private consumes?;
  constructor(
    node: ts.MethodDeclaration,
    current: MetadataGenerator,
    commonResponses: Tsoa.Response[],
    parentPath?: string | undefined,
    parentTags?: string[] | undefined,
    parentSecurity?: Tsoa.Security[] | undefined,
    isParentHidden?: boolean | undefined,
  );
  IsValid(): this is {
    method: HttpMethod;
    path: string;
  };
  Generate(): Tsoa.Method;
  private buildParameters;
  private validateBodyParameters;
  private validateQueryParameters;
  private getExtensions;
  private getCurrentLocation;
  private processMethodDecorators;
  private getProduces;
  private getConsumes;
  private getMethodResponses;
  private getMethodSuccessResponse;
  private getHeadersFromDecorator;
  private getSchemaFromDecorator;
  private getMethodSuccessExamples;
  private supportsPathMethod;
  private getIsDeprecated;
  private getOperationId;
  private getTags;
  private getSecurity;
  private getIsHidden;
  private getDecoratorsByIdentifier;
  private getProducesAdapter;
}
export {};
