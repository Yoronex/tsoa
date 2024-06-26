'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.KoaTemplateService = void 0;
const templateHelpers_1 = require('../../templateHelpers');
const templateService_1 = require('../templateService');
const koaTsoaResponsed = Symbol('@tsoa:template_service:koa:is_responsed');
class KoaTemplateService extends templateService_1.TemplateService {
  async apiHandler(params) {
    const { methodName, controller, context, validatedArgs, successStatus } = params;
    try {
      const data = await this.buildPromise(methodName, controller, validatedArgs);
      let statusCode = successStatus;
      let headers;
      if (this.isController(controller)) {
        headers = controller.getHeaders();
        statusCode = controller.getStatus() || statusCode;
      }
      return this.returnHandler({ context, headers, statusCode, data });
    } catch (error) {
      context.status = error.status || 500;
      context.throw(context.status, error.message, error);
    }
  }
  getValidatedArgs(params) {
    const { args, context, next } = params;
    const errorFields = {};
    const values = Object.values(args).map(param => {
      const name = param.name;
      switch (param.in) {
        case 'request':
          return context.request;
        case 'request-prop': {
          const descriptor = Object.getOwnPropertyDescriptor(context.request, name);
          const value = descriptor ? descriptor.value : undefined;
          return this.validationService.ValidateParam(param, value, name, errorFields, false, undefined);
        }
        case 'query':
          return this.validationService.ValidateParam(param, context.request.query[name], name, errorFields, false, undefined);
        case 'queries':
          return this.validationService.ValidateParam(param, context.request.query, name, errorFields, false, undefined);
        case 'path':
          return this.validationService.ValidateParam(param, context.params[name], name, errorFields, false, undefined);
        case 'header':
          return this.validationService.ValidateParam(param, context.request.headers[name], name, errorFields, false, undefined);
        case 'body': {
          const descriptor = Object.getOwnPropertyDescriptor(context.request, 'body');
          const value = descriptor ? descriptor.value : undefined;
          return this.validationService.ValidateParam(param, value, name, errorFields, true, undefined);
        }
        case 'body-prop': {
          const descriptor = Object.getOwnPropertyDescriptor(context.request, 'body');
          const value = descriptor ? descriptor.value[name] : undefined;
          return this.validationService.ValidateParam(param, value, name, errorFields, true, 'body.');
        }
        case 'formData': {
          const files = Object.values(args).filter(p => p.dataType === 'file' || (p.dataType === 'array' && p.array && p.array.dataType === 'file'));
          const contextRequest = context.request;
          if ((param.dataType === 'file' || (param.dataType === 'array' && param.array && param.array.dataType === 'file')) && files.length > 0) {
            if (contextRequest.files[name] === undefined) {
              return undefined;
            }
            const fileArgs = this.validationService.ValidateParam(param, contextRequest.files[name], name, errorFields, false, undefined);
            if (param.dataType === 'array') {
              return fileArgs;
            }
            return fileArgs.length === 1 ? fileArgs[0] : fileArgs;
          }
          return this.validationService.ValidateParam(param, contextRequest.body[name], name, errorFields, false, undefined);
        }
        case 'res':
          return async (status, data, headers) => {
            await this.returnHandler({ context, headers, statusCode: status, data, next });
          };
      }
    });
    if (Object.keys(errorFields).length > 0) {
      throw new templateHelpers_1.ValidateError(errorFields, '');
    }
    return values;
  }
  returnHandler(params) {
    const { context, next, statusCode, data } = params;
    let { headers } = params;
    headers = headers || {};
    const isResponsed = Object.getOwnPropertyDescriptor(context.response, koaTsoaResponsed);
    if (!context.headerSent && !isResponsed) {
      if (data !== null && data !== undefined) {
        context.body = data;
        context.status = 200;
      } else {
        context.status = 204;
      }
      if (statusCode) {
        context.status = statusCode;
      }
      context.set(headers);
      Object.defineProperty(context.response, koaTsoaResponsed, {
        value: true,
        writable: false,
      });
      return next ? next() : context;
    }
    return undefined;
  }
}
exports.KoaTemplateService = KoaTemplateService;
//# sourceMappingURL=koaTemplateService.js.map
