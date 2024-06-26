import { Request as ExRequest, Response as ExResponse, NextFunction as ExNext } from 'express';
import { Controller } from '../../../interfaces/controller';
import { TsoaRoute } from '../../tsoa-route';
import { TemplateService } from '../templateService';
type ExpressApiHandlerParameters = {
  methodName: string;
  controller: Controller | Object;
  response: ExResponse;
  next: ExNext;
  validatedArgs: any[];
  successStatus?: number;
};
type ExpressValidationArgsParameters = {
  args: Record<string, TsoaRoute.ParameterSchema>;
  request: ExRequest;
  response: ExResponse;
};
type ExpressReturnHandlerParameters = {
  response: ExResponse;
  headers: any;
  statusCode?: number;
  data?: any;
};
export declare class ExpressTemplateService extends TemplateService<ExpressApiHandlerParameters, ExpressValidationArgsParameters, ExpressReturnHandlerParameters> {
  apiHandler(params: ExpressApiHandlerParameters): Promise<void>;
  getValidatedArgs(params: ExpressValidationArgsParameters): any[];
  protected returnHandler(params: ExpressReturnHandlerParameters): void;
}
export {};
