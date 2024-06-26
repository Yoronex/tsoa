'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getExtensionsFromJSDocComments = exports.getExtensions = void 0;
const ts = __importStar(require('typescript'));
const initializer_value_1 = require('./initializer-value');
const jsonUtils_1 = require('../utils/jsonUtils');
function getExtensions(decorators, metadataGenerator) {
  const extensions = decorators.map(extensionDecorator => {
    if (!ts.isCallExpression(extensionDecorator.parent)) {
      throw new Error('The parent of the @Extension is not a CallExpression. Are you using it in the right place?');
    }
    const [decoratorKeyArg, decoratorValueArg] = extensionDecorator.parent.arguments;
    if (!ts.isStringLiteral(decoratorKeyArg)) {
      throw new Error('The first argument of @Extension must be a string');
    }
    const attributeKey = decoratorKeyArg.text;
    if (!decoratorValueArg) {
      throw new Error(`Extension '${attributeKey}' must contain a value`);
    }
    assertValidExtensionKey(attributeKey);
    const attributeValue = (0, initializer_value_1.getInitializerValue)(decoratorValueArg, metadataGenerator.typeChecker);
    if (!(0, initializer_value_1.isNonUndefinedInitializerValue)(attributeValue)) {
      throw new Error(`Extension '${attributeKey}' cannot have an undefined initializer value`);
    }
    return { key: attributeKey, value: attributeValue };
  });
  return extensions;
}
exports.getExtensions = getExtensions;
function getExtensionsFromJSDocComments(comments) {
  const extensions = [];
  comments.forEach(comment => {
    const extensionData = (0, jsonUtils_1.safeFromJson)(comment);
    if (extensionData) {
      const keys = Object.keys(extensionData);
      keys.forEach(key => {
        assertValidExtensionKey(key);
        extensions.push({ key: key, value: extensionData[key] });
      });
    }
  });
  return extensions;
}
exports.getExtensionsFromJSDocComments = getExtensionsFromJSDocComments;
function assertValidExtensionKey(key) {
  if (!key.startsWith('x-')) {
    throw new Error('Extensions must begin with "x-" to be valid. Please see the following link for more information: https://swagger.io/docs/specification/openapi-extensions/');
  }
}
//# sourceMappingURL=extension.js.map
