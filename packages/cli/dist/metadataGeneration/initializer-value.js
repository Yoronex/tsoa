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
exports.getInitializerValue = exports.isNonUndefinedInitializerValue = void 0;
const ts = __importStar(require('typescript'));
const hasInitializer = node => Object.prototype.hasOwnProperty.call(node, 'initializer');
const extractInitializer = decl => (decl && hasInitializer(decl) && decl.initializer) || undefined;
const extractImportSpecifier = symbol => (symbol?.declarations && symbol.declarations.length > 0 && ts.isImportSpecifier(symbol.declarations[0]) && symbol.declarations[0]) || undefined;
function isNonUndefinedInitializerValue(value) {
  if (Array.isArray(value)) {
    return value.every(isNonUndefinedInitializerValue);
  } else {
    return value !== undefined;
  }
}
exports.isNonUndefinedInitializerValue = isNonUndefinedInitializerValue;
function getInitializerValue(initializer, typeChecker, type) {
  if (!initializer || !typeChecker) {
    return;
  }
  switch (initializer.kind) {
    case ts.SyntaxKind.ArrayLiteralExpression: {
      const arrayLiteral = initializer;
      return arrayLiteral.elements.map(element => getInitializerValue(element, typeChecker));
    }
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return initializer.text;
    case ts.SyntaxKind.TrueKeyword:
      return true;
    case ts.SyntaxKind.FalseKeyword:
      return false;
    case ts.SyntaxKind.PrefixUnaryExpression: {
      const prefixUnary = initializer;
      switch (prefixUnary.operator) {
        case ts.SyntaxKind.PlusToken:
          return Number(prefixUnary.operand.text);
        case ts.SyntaxKind.MinusToken:
          return Number(`-${prefixUnary.operand.text}`);
        default:
          throw new Error(`Unsupport prefix operator token: ${prefixUnary.operator}`);
      }
    }
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.FirstLiteralToken:
      return Number(initializer.text);
    case ts.SyntaxKind.NewExpression: {
      const newExpression = initializer;
      const ident = newExpression.expression;
      if (ident.text === 'Date') {
        let date = new Date();
        if (newExpression.arguments) {
          const newArguments = newExpression.arguments.filter(args => args.kind !== undefined);
          const argsValue = newArguments.map(args => getInitializerValue(args, typeChecker));
          if (argsValue.length > 0) {
            date = new Date(argsValue);
          }
        }
        const dateString = date.toISOString();
        if (type && type.dataType === 'date') {
          return dateString.split('T')[0];
        }
        return dateString;
      }
      return;
    }
    case ts.SyntaxKind.NullKeyword:
      return null;
    case ts.SyntaxKind.ObjectLiteralExpression: {
      const objectLiteral = initializer;
      const nestedObject = {};
      objectLiteral.properties.forEach(p => {
        nestedObject[p.name.text] = getInitializerValue(p.initializer, typeChecker);
      });
      return nestedObject;
    }
    case ts.SyntaxKind.ImportSpecifier: {
      const importSpecifier = initializer;
      const importSymbol = typeChecker.getSymbolAtLocation(importSpecifier.name);
      if (!importSymbol) return;
      const aliasedSymbol = typeChecker.getAliasedSymbol(importSymbol);
      const declarations = aliasedSymbol.getDeclarations();
      const declaration = declarations && declarations.length > 0 ? declarations[0] : undefined;
      return getInitializerValue(extractInitializer(declaration), typeChecker);
    }
    default: {
      const symbol = typeChecker.getSymbolAtLocation(initializer);
      return getInitializerValue(extractInitializer(symbol?.valueDeclaration) || extractImportSpecifier(symbol), typeChecker);
    }
  }
}
exports.getInitializerValue = getInitializerValue;
//# sourceMappingURL=initializer-value.js.map
