'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TemplateService = void 0;
const templateHelpers_1 = require('../templateHelpers');
class TemplateService {
  constructor(models, config) {
    this.models = models;
    this.config = config;
    this.validationService = new templateHelpers_1.ValidationService(models, config);
  }
  isController(object) {
    return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
  }
  buildPromise(methodName, controller, validatedArgs) {
    const prototype = Object.getPrototypeOf(controller);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
    return descriptor.value.apply(controller, validatedArgs);
  }
}
exports.TemplateService = TemplateService;
//# sourceMappingURL=templateService.js.map
