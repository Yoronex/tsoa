'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.EnumTransformer = void 0;
const typescript_1 = require('typescript');
const transformer_1 = require('./transformer');
const jsDocUtils_1 = require('../../utils/jsDocUtils');
class EnumTransformer extends transformer_1.Transformer {
  static mergeMany(many) {
    let merged = this.merge(many[0], many[1]);
    for (let i = 2; i < many.length; ++i) {
      merged = this.merge(merged, many[i]);
    }
    return merged;
  }
  static merge(first, second) {
    const description = first.description ? (second.description ? `${first.description}\n${second.description}` : first.description) : second.description;
    const deprecated = first.deprecated || second.deprecated;
    const enums = first.enums ? (second.enums ? [...first.enums, ...second.enums] : first.enums) : second.enums;
    const enumVarnames = first.enumVarnames ? (second.enumVarnames ? [...first.enumVarnames, ...second.enumVarnames] : first.enumVarnames) : second.enumVarnames;
    const example = first.example || second.example;
    return {
      dataType: 'refEnum',
      description,
      enums,
      enumVarnames,
      refName: first.refName,
      deprecated,
      example,
    };
  }
  static transformable(declaration) {
    return (0, typescript_1.isEnumDeclaration)(declaration) || (0, typescript_1.isEnumMember)(declaration);
  }
  transform(declaration, enumName) {
    if ((0, typescript_1.isEnumDeclaration)(declaration)) {
      return this.transformDeclaration(declaration, enumName);
    }
    return this.transformMember(declaration, enumName);
  }
  transformDeclaration(declaration, enumName) {
    const isNotUndefined = item => {
      return item === undefined ? false : true;
    };
    const enums = declaration.members.map(e => this.resolver.current.typeChecker.getConstantValue(e)).filter(isNotUndefined);
    const enumVarnames = declaration.members.map(e => e.name.getText()).filter(isNotUndefined);
    return {
      dataType: 'refEnum',
      description: this.resolver.getNodeDescription(declaration),
      example: this.resolver.getNodeExample(declaration),
      enums,
      enumVarnames,
      refName: enumName,
      deprecated: (0, jsDocUtils_1.isExistJSDocTag)(declaration, tag => tag.tagName.text === 'deprecated'),
    };
  }
  transformMember(declaration, enumName) {
    return {
      dataType: 'refEnum',
      refName: enumName,
      enums: [this.resolver.current.typeChecker.getConstantValue(declaration)],
      enumVarnames: [declaration.name.getText()],
      deprecated: (0, jsDocUtils_1.isExistJSDocTag)(declaration, tag => tag.tagName.text === 'deprecated'),
    };
  }
}
exports.EnumTransformer = EnumTransformer;
//# sourceMappingURL=enumTransformer.js.map
