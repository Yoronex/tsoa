import { Controller } from '../../interfaces/controller';
import { TsoaRoute } from '../tsoa-route';
import { ValidationService } from '../templateHelpers';
import { AdditionalProps } from '../additionalProps';
export declare abstract class TemplateService<ApiHandlerParameters, ValidationArgsParameters, ReturnHandlerParameters> {
  protected readonly models: TsoaRoute.Models;
  protected readonly config: AdditionalProps;
  protected validationService: ValidationService;
  constructor(models: TsoaRoute.Models, config: AdditionalProps);
  abstract apiHandler(params: ApiHandlerParameters): Promise<any>;
  abstract getValidatedArgs(params: ValidationArgsParameters): any[];
  protected abstract returnHandler(params: ReturnHandlerParameters): any;
  protected isController(object: Controller | Object): object is Controller;
  protected buildPromise(methodName: string, controller: Controller | Object, validatedArgs: any): any;
}
