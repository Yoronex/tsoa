'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.HapiTemplateService = void 0;
const templateHelpers_1 = require('../../templateHelpers');
const templateService_1 = require('../templateService');
const hapiTsoaResponsed = Symbol('@tsoa:template_service:hapi:responsed');
class HapiTemplateService extends templateService_1.TemplateService {
  constructor(models, config, hapi) {
    super(models, config);
    this.models = models;
    this.config = config;
    this.hapi = hapi;
  }
  async apiHandler(params) {
    const { methodName, controller, h, validatedArgs, successStatus } = params;
    try {
      const data = await this.buildPromise(methodName, controller, validatedArgs);
      let statusCode = successStatus;
      let headers;
      if (this.isController(controller)) {
        headers = controller.getHeaders();
        statusCode = controller.getStatus() || statusCode;
      }
      return this.returnHandler({ h, headers, statusCode, data });
    } catch (error) {
      if (this.hapi.isBoom(error)) {
        throw error;
      }
      const boomErr = this.hapi.boomify(error instanceof Error ? error : new Error(error.message));
      boomErr.output.statusCode = error.status || 500;
      boomErr.output.payload = {
        name: error.name,
        message: error.message,
      };
      throw boomErr;
    }
  }
  getValidatedArgs(params) {
    const { args, request, h } = params;
    const errorFields = {};
    const values = Object.values(args).map(param => {
      const name = param.name;
      switch (param.in) {
        case 'request':
          return request;
        case 'request-prop': {
          const descriptor = Object.getOwnPropertyDescriptor(request, name);
          const value = descriptor ? descriptor.value : undefined;
          return this.validationService.ValidateParam(param, value, name, errorFields, false, undefined);
        }
        case 'query':
          return this.validationService.ValidateParam(param, request.query[name], name, errorFields, false, undefined);
        case 'queries':
          return this.validationService.ValidateParam(param, request.query, name, errorFields, false, undefined);
        case 'path':
          return this.validationService.ValidateParam(param, request.params[name], name, errorFields, false, undefined);
        case 'header':
          return this.validationService.ValidateParam(param, request.headers[name], name, errorFields, false, undefined);
        case 'body':
          return this.validationService.ValidateParam(param, request.payload, name, errorFields, true, undefined);
        case 'body-prop': {
          const descriptor = Object.getOwnPropertyDescriptor(request.payload, name);
          const value = descriptor ? descriptor.value : undefined;
          return this.validationService.ValidateParam(param, value, name, errorFields, true, 'body.');
        }
        case 'formData': {
          const descriptor = Object.getOwnPropertyDescriptor(request.payload, name);
          const value = descriptor ? descriptor.value : undefined;
          return this.validationService.ValidateParam(param, value, name, errorFields, false, undefined);
        }
        case 'res':
          return (status, data, headers) => {
            this.returnHandler({ h, headers, statusCode: status, data });
          };
      }
    });
    if (Object.keys(errorFields).length > 0) {
      throw new templateHelpers_1.ValidateError(errorFields, '');
    }
    return values;
  }
  returnHandler(params) {
    const { h, statusCode, data } = params;
    let { headers } = params;
    headers = headers || {};
    const tsoaResponsed = Object.getOwnPropertyDescriptor(h, hapiTsoaResponsed);
    if (tsoaResponsed) {
      return tsoaResponsed.value;
    }
    const response = data !== null && data !== undefined ? h.response(data).code(200) : h.response('').code(204);
    Object.keys(headers).forEach(name => {
      response.header(name, headers[name]);
    });
    if (statusCode) {
      response.code(statusCode);
    }
    Object.defineProperty(h, hapiTsoaResponsed, {
      value: response,
      writable: false,
    });
    return response;
  }
}
exports.HapiTemplateService = HapiTemplateService;
//# sourceMappingURL=hapiTemplateService.js.map
