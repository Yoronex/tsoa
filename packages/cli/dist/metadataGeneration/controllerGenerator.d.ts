import { MetadataGenerator } from './metadataGenerator';
import { Tsoa } from '@tsoa/runtime';
import { type ClassDeclaration } from 'typescript';
export declare class ControllerGenerator {
  private readonly node;
  private readonly current;
  private readonly parentSecurity;
  private readonly path?;
  private readonly tags?;
  private readonly security?;
  private readonly isHidden?;
  private readonly commonResponses;
  private readonly produces?;
  constructor(node: ClassDeclaration, current: MetadataGenerator, parentSecurity?: Tsoa.Security[]);
  IsValid(): boolean;
  Generate(): Tsoa.Controller;
  private buildMethods;
  private getPath;
  private getCommonResponses;
  private getTags;
  private getSecurity;
  private getIsHidden;
  private getProduces;
}
