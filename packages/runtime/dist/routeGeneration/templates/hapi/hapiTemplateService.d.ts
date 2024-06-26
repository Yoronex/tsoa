import { Request as HRequest, ResponseToolkit as HResponse } from '@hapi/hapi';
import { Controller } from '../../../interfaces/controller';
import { TsoaRoute } from '../../tsoa-route';
import { TemplateService } from '../templateService';
import { AdditionalProps } from '../../additionalProps';
type HapiApiHandlerParameters = {
  methodName: string;
  controller: Controller | Object;
  h: HResponse;
  validatedArgs: any[];
  successStatus?: number;
};
type HapiValidationArgsParameters = {
  args: Record<string, TsoaRoute.ParameterSchema>;
  request: HRequest;
  h: HResponse;
};
type HapiReturnHandlerParameters = {
  h: HResponse;
  headers: any;
  statusCode?: number;
  data?: any;
};
export declare class HapiTemplateService extends TemplateService<HapiApiHandlerParameters, HapiValidationArgsParameters, HapiReturnHandlerParameters> {
  protected readonly models: TsoaRoute.Models;
  protected readonly config: AdditionalProps;
  private readonly hapi;
  constructor(
    models: TsoaRoute.Models,
    config: AdditionalProps,
    hapi: {
      boomify: Function;
      isBoom: Function;
    },
  );
  apiHandler(params: HapiApiHandlerParameters): Promise<any>;
  getValidatedArgs(params: HapiValidationArgsParameters): any[];
  protected returnHandler(params: HapiReturnHandlerParameters): any;
}
export {};
