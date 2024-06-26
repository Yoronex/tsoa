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
exports.getProduces =
  exports.getPath =
  exports.isDecorator =
  exports.getSecurites =
  exports.getDecoratorValues =
  exports.getNodeFirstDecoratorValue =
  exports.getNodeFirstDecoratorName =
  exports.getDecorators =
    void 0;
const ts = __importStar(require('typescript'));
const initializer_value_1 = require('../metadataGeneration/initializer-value');
function tsHasDecorators(tsNamespace) {
  return typeof tsNamespace.canHaveDecorators === 'function';
}
function getDecorators(node, isMatching) {
  // beginning in ts4.8 node.decorator is undefined, use getDecorators instead.
  const decorators = tsHasDecorators(ts) && ts.canHaveDecorators(node) ? ts.getDecorators(node) : [];
  if (!decorators || !decorators.length) {
    return [];
  }
  return decorators
    .map(e => {
      while (e.expression !== undefined) {
        e = e.expression;
      }
      return e;
    })
    .filter(isMatching);
}
exports.getDecorators = getDecorators;
function getNodeFirstDecoratorName(node, isMatching) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return;
  }
  return decorators[0].text;
}
exports.getNodeFirstDecoratorName = getNodeFirstDecoratorName;
function getNodeFirstDecoratorValue(node, typeChecker, isMatching) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return;
  }
  const values = getDecoratorValues(decorators[0], typeChecker);
  return values && values[0];
}
exports.getNodeFirstDecoratorValue = getNodeFirstDecoratorValue;
function getDecoratorValues(decorator, typeChecker) {
  const expression = decorator.parent;
  const expArguments = expression.arguments;
  if (!expArguments || !expArguments.length) {
    return [];
  }
  return expArguments.map(a => (0, initializer_value_1.getInitializerValue)(a, typeChecker));
}
exports.getDecoratorValues = getDecoratorValues;
function getSecurites(decorator, typeChecker) {
  const [first, second] = getDecoratorValues(decorator, typeChecker);
  if (isObject(first)) {
    return first;
  }
  return { [first]: second || [] };
}
exports.getSecurites = getSecurites;
function isDecorator(node, isMatching) {
  const decorators = getDecorators(node, isMatching);
  if (!decorators || !decorators.length) {
    return false;
  }
  return true;
}
exports.isDecorator = isDecorator;
function isObject(v) {
  return typeof v === 'object' && v !== null;
}
function getPath(decorator, typeChecker) {
  const [path] = getDecoratorValues(decorator, typeChecker);
  if (path === undefined) {
    return '';
  }
  return path;
}
exports.getPath = getPath;
function getProduces(node, typeChecker) {
  const producesDecorators = getDecorators(node, identifier => identifier.text === 'Produces');
  if (!producesDecorators || !producesDecorators.length) {
    return [];
  }
  return producesDecorators.map(decorator => getDecoratorValues(decorator, typeChecker)[0]);
}
exports.getProduces = getProduces;
//# sourceMappingURL=decoratorUtils.js.map
