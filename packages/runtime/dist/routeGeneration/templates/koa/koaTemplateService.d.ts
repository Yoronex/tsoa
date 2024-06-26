import type { Context, Next } from 'koa';
import { Controller } from '../../../interfaces/controller';
import { TsoaRoute } from '../../tsoa-route';
import { TemplateService } from '../templateService';
type KoaApiHandlerParameters = {
  methodName: string;
  controller: Controller | Object;
  context: Context;
  validatedArgs: any[];
  successStatus?: number;
};
type KoaValidationArgsParameters = {
  args: Record<string, TsoaRoute.ParameterSchema>;
  context: Context;
  next: Next;
};
type KoaReturnHandlerParameters = {
  context: Context;
  next?: Next;
  headers: any;
  statusCode?: number;
  data?: any;
};
export declare class KoaTemplateService extends TemplateService<KoaApiHandlerParameters, KoaValidationArgsParameters, KoaReturnHandlerParameters> {
  apiHandler(params: KoaApiHandlerParameters): Promise<any>;
  getValidatedArgs(params: KoaValidationArgsParameters): any[];
  protected returnHandler(params: KoaReturnHandlerParameters): Promise<any> | Context | undefined;
}
export {};
