'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PrimitiveTransformer = void 0;
const typescript_1 = require('typescript');
const runtime_1 = require('@tsoa/runtime');
const transformer_1 = require('./transformer');
const jsDocUtils_1 = require('../../utils/jsDocUtils');
class PrimitiveTransformer extends transformer_1.Transformer {
  static resolveKindToPrimitive(syntaxKind) {
    switch (syntaxKind) {
      case typescript_1.SyntaxKind.NumberKeyword:
        return 'number';
      case typescript_1.SyntaxKind.StringKeyword:
        return 'string';
      case typescript_1.SyntaxKind.BooleanKeyword:
        return 'boolean';
      case typescript_1.SyntaxKind.VoidKeyword:
        return 'void';
      case typescript_1.SyntaxKind.UndefinedKeyword:
        return 'undefined';
      default:
        return undefined;
    }
  }
  transform(typeNode, parentNode) {
    const resolvedType = PrimitiveTransformer.resolveKindToPrimitive(typeNode.kind);
    if (!resolvedType) {
      return;
    }
    const defaultNumberType = this.resolver.current.defaultNumberType;
    switch (resolvedType) {
      case 'number':
        return this.transformNumber(defaultNumberType, parentNode);
      case 'string':
      case 'boolean':
      case 'void':
      case 'undefined':
        return { dataType: resolvedType };
      default:
        return (0, runtime_1.assertNever)(resolvedType);
    }
  }
  transformNumber(defaultNumberType, parentNode) {
    if (!parentNode) {
      return { dataType: defaultNumberType };
    }
    const tags = (0, jsDocUtils_1.getJSDocTagNames)(parentNode).filter(name => {
      return ['isInt', 'isLong', 'isFloat', 'isDouble'].some(m => m === name);
    });
    if (tags.length === 0) {
      return { dataType: defaultNumberType };
    }
    switch (tags[0]) {
      case 'isInt':
        return { dataType: 'integer' };
      case 'isLong':
        return { dataType: 'long' };
      case 'isFloat':
        return { dataType: 'float' };
      case 'isDouble':
        return { dataType: 'double' };
      default:
        return { dataType: defaultNumberType };
    }
  }
}
exports.PrimitiveTransformer = PrimitiveTransformer;
//# sourceMappingURL=primitiveTransformer.js.map
