'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ReferenceTransformer = void 0;
const transformer_1 = require('./transformer');
const enumTransformer_1 = require('./enumTransformer');
const typeResolver_1 = require('../typeResolver');
const exceptions_1 = require('../exceptions');
const validatorUtils_1 = require('../../utils/validatorUtils');
class ReferenceTransformer extends transformer_1.Transformer {
  static merge(referenceTypes) {
    if (referenceTypes.length === 1) {
      return referenceTypes[0];
    }
    if (referenceTypes.every(refType => refType.dataType === 'refEnum')) {
      return enumTransformer_1.EnumTransformer.mergeMany(referenceTypes);
    }
    if (referenceTypes.every(refType => refType.dataType === 'refObject')) {
      return this.mergeManyRefObj(referenceTypes);
    }
    throw new exceptions_1.GenerateMetadataError(`These resolved type merge rules are not defined: ${JSON.stringify(referenceTypes)}`);
  }
  static mergeManyRefObj(many) {
    let merged = this.mergeRefObj(many[0], many[1]);
    for (let i = 2; i < many.length; ++i) {
      merged = this.mergeRefObj(merged, many[i]);
    }
    return merged;
  }
  static mergeRefObj(first, second) {
    const description = first.description ? (second.description ? `${first.description}\n${second.description}` : first.description) : second.description;
    const deprecated = first.deprecated || second.deprecated;
    const example = first.example || second.example;
    const properties = [...first.properties, ...second.properties.filter(prop => first.properties.every(firstProp => firstProp.name !== prop.name))];
    const mergeAdditionalTypes = (first, second) => {
      return {
        dataType: 'union',
        types: [first, second],
      };
    };
    const additionalProperties = first.additionalProperties
      ? second.additionalProperties
        ? mergeAdditionalTypes(first.additionalProperties, second.additionalProperties)
        : first.additionalProperties
      : second.additionalProperties;
    const result = {
      dataType: 'refObject',
      description,
      properties,
      additionalProperties,
      refName: first.refName,
      deprecated,
      example,
    };
    return result;
  }
  transform(declaration, refTypeName, referencer) {
    const example = this.resolver.getNodeExample(declaration);
    const referenceType = {
      dataType: 'refAlias',
      default: typeResolver_1.TypeResolver.getDefault(declaration),
      description: this.resolver.getNodeDescription(declaration),
      refName: refTypeName,
      format: this.resolver.getNodeFormat(declaration),
      type: new typeResolver_1.TypeResolver(declaration.type, this.resolver.current, declaration, this.resolver.context, this.resolver.referencer || referencer).resolve(),
      validators: (0, validatorUtils_1.getPropertyValidators)(declaration) || {},
      ...(example && { example }),
    };
    return referenceType;
  }
}
exports.ReferenceTransformer = ReferenceTransformer;
//# sourceMappingURL=referenceTransformer.js.map
