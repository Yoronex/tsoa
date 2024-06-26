'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Transformer = void 0;
const typescript_1 = require('typescript');
/**
 * Transformer responsible to transforming native ts node into tsoa type.
 */
class Transformer {
  constructor(resolver) {
    this.resolver = resolver;
  }
  hasPublicModifier(node) {
    return (
      !node.modifiers ||
      node.modifiers.every(modifier => {
        return modifier.kind !== typescript_1.SyntaxKind.ProtectedKeyword && modifier.kind !== typescript_1.SyntaxKind.PrivateKeyword;
      })
    );
  }
  hasStaticModifier(node) {
    return (
      node.modifiers &&
      node.modifiers.some(modifier => {
        return modifier.kind === typescript_1.SyntaxKind.StaticKeyword;
      })
    );
  }
  isAccessibleParameter(node) {
    const modifiers = (0, typescript_1.getModifiers)(node);
    if (modifiers == null || modifiers.length === 0) {
      return false;
    }
    // public || public readonly
    if (modifiers.some(modifier => modifier.kind === typescript_1.SyntaxKind.PublicKeyword)) {
      return true;
    }
    // readonly, not private readonly, not public readonly
    const isReadonly = modifiers.some(modifier => modifier.kind === typescript_1.SyntaxKind.ReadonlyKeyword);
    const isProtectedOrPrivate = modifiers.some(modifier => {
      return modifier.kind === typescript_1.SyntaxKind.ProtectedKeyword || modifier.kind === typescript_1.SyntaxKind.PrivateKeyword;
    });
    return isReadonly && !isProtectedOrPrivate;
  }
}
exports.Transformer = Transformer;
//# sourceMappingURL=transformer.js.map
