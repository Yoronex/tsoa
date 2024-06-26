import { type HasModifiers } from 'typescript';
import { TypeResolver } from '../typeResolver';
/**
 * Transformer responsible to transforming native ts node into tsoa type.
 */
export declare abstract class Transformer {
  protected readonly resolver: TypeResolver;
  constructor(resolver: TypeResolver);
  protected hasPublicModifier(node: HasModifiers): boolean;
  protected hasStaticModifier(node: HasModifiers): boolean | undefined;
  protected isAccessibleParameter(node: HasModifiers): boolean;
}
