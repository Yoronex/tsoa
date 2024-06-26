import * as ts from 'typescript';
import { ExtendedSpecConfig } from '../cli';
import { Tsoa, Config } from '@tsoa/runtime';
export declare const getSwaggerOutputPath: (swaggerConfig: ExtendedSpecConfig) => string;
export declare const generateSpec: (
  swaggerConfig: ExtendedSpecConfig,
  compilerOptions?: ts.CompilerOptions,
  ignorePaths?: string[],
  metadata?: Tsoa.Metadata,
  defaultNumberType?: Config['defaultNumberType'],
) => Promise<Tsoa.Metadata>;
