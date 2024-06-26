import { Config, Tsoa } from '@tsoa/runtime';
import { type ClassDeclaration, type CompilerOptions, type TypeChecker } from 'typescript';
export declare class MetadataGenerator {
  private readonly compilerOptions?;
  private readonly ignorePaths?;
  private readonly rootSecurity;
  readonly defaultNumberType: NonNullable<Config['defaultNumberType']>;
  readonly controllerNodes: ClassDeclaration[];
  readonly typeChecker: TypeChecker;
  private readonly program;
  private referenceTypeMap;
  private modelDefinitionPosMap;
  private expressionOrigNameMap;
  constructor(
    entryFile: string,
    compilerOptions?: CompilerOptions | undefined,
    ignorePaths?: string[] | undefined,
    controllers?: string[],
    rootSecurity?: Tsoa.Security[],
    defaultNumberType?: NonNullable<Config['defaultNumberType']>,
    esm?: boolean,
  );
  Generate(): Tsoa.Metadata;
  private setProgramToDynamicControllersFiles;
  private extractNodeFromProgramSourceFiles;
  private checkForMethodSignatureDuplicates;
  private checkForPathParamSignatureDuplicates;
  TypeChecker(): TypeChecker;
  AddReferenceType(referenceType: Tsoa.ReferenceType): void;
  GetReferenceType(refName: string): Tsoa.ReferenceType;
  CheckModelUnicity(
    refName: string,
    positions: Array<{
      fileName: string;
      pos: number;
    }>,
  ): void;
  CheckExpressionUnicity(formattedRefName: string, refName: string): void;
  private buildControllers;
}
