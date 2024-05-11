'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ExpressTemplateService = void 0;
const templateHelpers_1 = require('../../templateHelpers');
const templateService_1 = require('../templateService');
class ExpressTemplateService extends templateService_1.TemplateService {
  async apiHandler(params) {
    const { methodName, controller, response, validatedArgs, successStatus, next } = params;
    try {
      const data = await this.buildPromise(methodName, controller, validatedArgs);
      let statusCode = successStatus;
      let headers;
      if (this.isController(controller)) {
        headers = controller.getHeaders();
        statusCode = controller.getStatus() || statusCode;
      }
      this.returnHandler({ response, headers, statusCode, data });
    } catch (error) {
      return next(error);
    }
  }
  getValidatedArgs(params) {
    const { args, request, response } = params;
    const fieldErrors = {};
    const values = Object.values(args).map(param => {
      const name = param.name;
      switch (param.in) {
        case 'request':
          return request;
        case 'request-prop': {
          const descriptor = Object.getOwnPropertyDescriptor(request, name);
          const value = descriptor ? descriptor.value : undefined;
          return this.validationService.ValidateParam(param, value, name, fieldErrors, false, undefined);
        }
        case 'query':
          return this.validationService.ValidateParam(param, request.query[name], name, fieldErrors, false, undefined);
        case 'queries':
          return this.validationService.ValidateParam(param, request.query, name, fieldErrors, false, undefined);
        case 'path':
          return this.validationService.ValidateParam(param, request.params[name], name, fieldErrors, false, undefined);
        case 'header':
          return this.validationService.ValidateParam(param, request.header(name), name, fieldErrors, false, undefined);
        case 'body':
          return this.validationService.ValidateParam(param, request.body, name, fieldErrors, true, undefined);
        case 'body-prop':
          return this.validationService.ValidateParam(param, request.body[name], name, fieldErrors, true, 'body.');
        case 'formData': {
          const files = Object.values(args).filter(p => p.dataType === 'file' || (p.dataType === 'array' && p.array && p.array.dataType === 'file'));
          if ((param.dataType === 'file' || (param.dataType === 'array' && param.array && param.array.dataType === 'file')) && files.length > 0) {
            const requestFiles = request.files;
            if (requestFiles[name] === undefined) {
              return undefined;
            }
            const fileArgs = this.validationService.ValidateParam(param, requestFiles[name], name, fieldErrors, false, undefined);
            return fileArgs.length === 1 ? fileArgs[0] : fileArgs;
          }
          return this.validationService.ValidateParam(param, request.body[name], name, fieldErrors, false, undefined);
        }
        case 'res':
          return (status, data, headers) => {
            this.returnHandler({ response, headers, statusCode: status, data });
          };
      }
    });
    if (Object.keys(fieldErrors).length > 0) {
      throw new templateHelpers_1.ValidateError(fieldErrors, '');
    }
    return values;
  }
  returnHandler(params) {
    const { response, statusCode, data } = params;
    let { headers } = params;
    headers = headers || {};
    if (response.headersSent) {
      return;
    }
    Object.keys(headers).forEach(name => {
      response.set(name, headers[name]);
    });
    if (data && typeof data.pipe === 'function' && data.readable && typeof data._read === 'function') {
      response.status(statusCode || 200);
      data.pipe(response);
    } else if (data !== null && data !== undefined) {
      response.status(statusCode || 200).json(data);
    } else {
      response.status(statusCode || 204).end();
    }
  }
}
exports.ExpressTemplateService = ExpressTemplateService;
//# sourceMappingURL=expressTemplateService.js.map
