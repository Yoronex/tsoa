'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PropertyTransformer = void 0;
const typescript_1 = require('typescript');
const transformer_1 = require('./transformer');
const exceptions_1 = require('../exceptions');
const typeResolver_1 = require('../typeResolver');
const initializer_value_1 = require('../initializer-value');
const validatorUtils_1 = require('../../utils/validatorUtils');
const jsDocUtils_1 = require('../../utils/jsDocUtils');
const decoratorUtils_1 = require('../../utils/decoratorUtils');
const flowUtils_1 = require('../../utils/flowUtils');
class PropertyTransformer extends transformer_1.Transformer {
  transform(node, overrideToken) {
    const isIgnored = e => {
      let ignore = (0, jsDocUtils_1.isExistJSDocTag)(e, tag => tag.tagName.text === 'ignore');
      ignore = ignore || (e.flags & typescript_1.NodeFlags.ThisNodeHasError) > 0;
      return ignore;
    };
    // Interface model
    if ((0, typescript_1.isInterfaceDeclaration)(node)) {
      return node.members.filter(member => !isIgnored(member) && (0, typescript_1.isPropertySignature)(member)).map(member => this.propertyFromSignature(member, overrideToken));
    }
    const properties = [];
    for (const member of node.members) {
      if (!isIgnored(member) && (0, typescript_1.isPropertyDeclaration)(member) && !this.hasStaticModifier(member) && this.hasPublicModifier(member)) {
        properties.push(member);
      }
    }
    const classConstructor = node.members.find(member => (0, typescript_1.isConstructorDeclaration)(member));
    if (classConstructor && classConstructor.parameters) {
      const constructorProperties = classConstructor.parameters.filter(parameter => this.isAccessibleParameter(parameter));
      properties.push(...constructorProperties);
    }
    return properties.map(property => this.propertyFromDeclaration(property, overrideToken));
  }
  propertyFromSignature(propertySignature, overrideToken) {
    (0, flowUtils_1.throwUnless)(propertySignature.type, new exceptions_1.GenerateMetadataError(`No valid type found for property declaration.`));
    let required = !propertySignature.questionToken;
    if (overrideToken && overrideToken.kind === typescript_1.SyntaxKind.MinusToken) {
      required = true;
    } else if (overrideToken && overrideToken.kind === typescript_1.SyntaxKind.QuestionToken) {
      required = false;
    }
    const def = typeResolver_1.TypeResolver.getDefault(propertySignature);
    const property = {
      default: def,
      description: this.resolver.getNodeDescription(propertySignature),
      example: this.resolver.getNodeExample(propertySignature),
      format: this.resolver.getNodeFormat(propertySignature),
      name: this.resolver.getPropertyName(propertySignature),
      required,
      type: new typeResolver_1.TypeResolver(propertySignature.type, this.resolver.current, propertySignature.type.parent, this.resolver.context).resolve(),
      validators: (0, validatorUtils_1.getPropertyValidators)(propertySignature) || {},
      deprecated: (0, jsDocUtils_1.isExistJSDocTag)(propertySignature, tag => tag.tagName.text === 'deprecated'),
      extensions: this.resolver.getNodeExtension(propertySignature),
    };
    return property;
  }
  propertyFromDeclaration(propertyDeclaration, overrideToken) {
    let typeNode = propertyDeclaration.type;
    const tsType = this.resolver.current.typeChecker.getTypeAtLocation(propertyDeclaration);
    if (!typeNode) {
      // Type is from initializer
      typeNode = this.resolver.current.typeChecker.typeToTypeNode(tsType, undefined, typescript_1.NodeBuilderFlags.NoTruncation);
    }
    const type = new typeResolver_1.TypeResolver(typeNode, this.resolver.current, propertyDeclaration, this.resolver.context, tsType).resolve();
    let required = !propertyDeclaration.questionToken && !propertyDeclaration.initializer;
    if (overrideToken && overrideToken.kind === typescript_1.SyntaxKind.MinusToken) {
      required = true;
    } else if (overrideToken && overrideToken.kind === typescript_1.SyntaxKind.QuestionToken) {
      required = false;
    }
    let def = (0, initializer_value_1.getInitializerValue)(propertyDeclaration.initializer, this.resolver.current.typeChecker);
    if (def === undefined) {
      def = typeResolver_1.TypeResolver.getDefault(propertyDeclaration);
    }
    const property = {
      default: def,
      description: this.resolver.getNodeDescription(propertyDeclaration),
      example: this.resolver.getNodeExample(propertyDeclaration),
      format: this.resolver.getNodeFormat(propertyDeclaration),
      name: this.resolver.getPropertyName(propertyDeclaration),
      required,
      type,
      validators: (0, validatorUtils_1.getPropertyValidators)(propertyDeclaration) || {},
      // class properties and constructor parameters may be deprecated either via jsdoc annotation or decorator
      deprecated:
        (0, jsDocUtils_1.isExistJSDocTag)(propertyDeclaration, tag => tag.tagName.text === 'deprecated') ||
        (0, decoratorUtils_1.isDecorator)(propertyDeclaration, identifier => identifier.text === 'Deprecated'),
      extensions: this.resolver.getNodeExtension(propertyDeclaration),
    };
    return property;
  }
}
exports.PropertyTransformer = PropertyTransformer;
//# sourceMappingURL=propertyTransformer.js.map
