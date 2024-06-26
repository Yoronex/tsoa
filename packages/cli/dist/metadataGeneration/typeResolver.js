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
exports.TypeResolver = void 0;
const runtime_1 = require('@tsoa/runtime');
const ts = __importStar(require('typescript'));
const jsonUtils_1 = require('../utils/jsonUtils');
const decoratorUtils_1 = require('./../utils/decoratorUtils');
const jsDocUtils_1 = require('./../utils/jsDocUtils');
const validatorUtils_1 = require('./../utils/validatorUtils');
const flowUtils_1 = require('../utils/flowUtils');
const exceptions_1 = require('./exceptions');
const extension_1 = require('./extension');
const initializer_value_1 = require('./initializer-value');
const primitiveTransformer_1 = require('./transformer/primitiveTransformer');
const dateTransformer_1 = require('./transformer/dateTransformer');
const enumTransformer_1 = require('./transformer/enumTransformer');
const propertyTransformer_1 = require('./transformer/propertyTransformer');
const referenceTransformer_1 = require('./transformer/referenceTransformer');
const localReferenceTypeCache = {};
const inProgressTypes = {};
class TypeResolver {
  constructor(typeNode, current, parentNode, context = {}, referencer) {
    this.typeNode = typeNode;
    this.current = current;
    this.parentNode = parentNode;
    this.context = context;
    this.referencer = referencer;
  }
  static clearCache() {
    Object.keys(localReferenceTypeCache).forEach(key => {
      delete localReferenceTypeCache[key];
    });
    Object.keys(inProgressTypes).forEach(key => {
      delete inProgressTypes[key];
    });
  }
  resolve() {
    const primitiveType = new primitiveTransformer_1.PrimitiveTransformer(this).transform(this.typeNode, this.parentNode);
    if (primitiveType) {
      return primitiveType;
    }
    if (this.typeNode.kind === ts.SyntaxKind.NullKeyword) {
      const enumType = {
        dataType: 'enum',
        enums: [null],
      };
      return enumType;
    }
    if (this.typeNode.kind === ts.SyntaxKind.UndefinedKeyword) {
      const undefinedType = {
        dataType: 'undefined',
      };
      return undefinedType;
    }
    if (ts.isArrayTypeNode(this.typeNode)) {
      const arrayMetaType = {
        dataType: 'array',
        elementType: new TypeResolver(this.typeNode.elementType, this.current, this.parentNode, this.context).resolve(),
      };
      return arrayMetaType;
    }
    if (ts.isUnionTypeNode(this.typeNode)) {
      const types = this.typeNode.types.map(type => {
        return new TypeResolver(type, this.current, this.parentNode, this.context).resolve();
      });
      const unionMetaType = {
        dataType: 'union',
        types,
      };
      return unionMetaType;
    }
    if (ts.isIntersectionTypeNode(this.typeNode)) {
      const types = this.typeNode.types.map(type => {
        return new TypeResolver(type, this.current, this.parentNode, this.context).resolve();
      });
      const intersectionMetaType = {
        dataType: 'intersection',
        types,
      };
      return intersectionMetaType;
    }
    if (this.typeNode.kind === ts.SyntaxKind.AnyKeyword || this.typeNode.kind === ts.SyntaxKind.UnknownKeyword) {
      const literallyAny = {
        dataType: 'any',
      };
      return literallyAny;
    }
    if (ts.isLiteralTypeNode(this.typeNode)) {
      const enumType = {
        dataType: 'enum',
        enums: [this.getLiteralValue(this.typeNode)],
      };
      return enumType;
    }
    if (ts.isTypeLiteralNode(this.typeNode)) {
      const properties = this.typeNode.members.filter(ts.isPropertySignature).reduce((res, propertySignature) => {
        const type = new TypeResolver(propertySignature.type, this.current, propertySignature, this.context).resolve();
        const def = TypeResolver.getDefault(propertySignature);
        const property = {
          example: this.getNodeExample(propertySignature),
          default: def,
          description: this.getNodeDescription(propertySignature),
          format: this.getNodeFormat(propertySignature),
          name: this.getPropertyName(propertySignature),
          required: !propertySignature.questionToken,
          type,
          validators: (0, validatorUtils_1.getPropertyValidators)(propertySignature) || {},
          deprecated: (0, jsDocUtils_1.isExistJSDocTag)(propertySignature, tag => tag.tagName.text === 'deprecated'),
          extensions: this.getNodeExtension(propertySignature),
        };
        return [property, ...res];
      }, []);
      const indexMember = this.typeNode.members.find(member => ts.isIndexSignatureDeclaration(member));
      let additionalType;
      if (indexMember) {
        const indexSignatureDeclaration = indexMember;
        const indexType = new TypeResolver(indexSignatureDeclaration.parameters[0].type, this.current, this.parentNode, this.context).resolve();
        (0, flowUtils_1.throwUnless)(indexType.dataType === 'string', new exceptions_1.GenerateMetadataError(`Only string indexers are supported.`, this.typeNode));
        additionalType = new TypeResolver(indexSignatureDeclaration.type, this.current, this.parentNode, this.context).resolve();
      }
      const objLiteral = {
        additionalProperties: indexMember && additionalType,
        dataType: 'nestedObjectLiteral',
        properties,
      };
      return objLiteral;
    }
    if (this.typeNode.kind === ts.SyntaxKind.ObjectKeyword) {
      return { dataType: 'object' };
    }
    if (ts.isMappedTypeNode(this.typeNode)) {
      const mappedTypeNode = this.typeNode;
      const getOneOrigDeclaration = prop => {
        if (prop.declarations) {
          return prop.declarations[0];
        }
        const syntheticOrigin = prop.links?.syntheticOrigin;
        if (syntheticOrigin && syntheticOrigin.name === prop.name) {
          //Otherwise losts jsDoc like in intellisense
          return syntheticOrigin.declarations?.[0];
        }
        return undefined;
      };
      const isIgnored = prop => {
        const declaration = getOneOrigDeclaration(prop);
        return (
          declaration !== undefined &&
          ((0, jsDocUtils_1.getJSDocTagNames)(declaration).some(tag => tag === 'ignore') ||
            (!ts.isPropertyDeclaration(declaration) && !ts.isPropertySignature(declaration) && !ts.isParameter(declaration)))
        );
      };
      const calcMappedType = type => {
        if (this.hasFlag(type, ts.TypeFlags.Union)) {
          //Intersections are not interesting somehow...
          const types = type.types;
          const resolvedTypes = types.map(calcMappedType);
          return {
            dataType: 'union',
            types: resolvedTypes,
          };
        } else if (this.hasFlag(type, ts.TypeFlags.Undefined)) {
          return {
            dataType: 'undefined',
          };
        } else if (this.hasFlag(type, ts.TypeFlags.Null)) {
          return {
            dataType: 'enum',
            enums: [null],
          };
        } else if (this.hasFlag(type, ts.TypeFlags.Object)) {
          const typeProperties = type.getProperties();
          const properties = typeProperties
            // Ignore methods, getter, setter and @ignored props
            .filter(property => isIgnored(property) === false)
            // Transform to property
            .map(property => {
              const propertyType = this.current.typeChecker.getTypeOfSymbolAtLocation(property, this.typeNode);
              const typeNode = this.current.typeChecker.typeToTypeNode(propertyType, undefined, ts.NodeBuilderFlags.NoTruncation);
              const parent = getOneOrigDeclaration(property); //If there are more declarations, we need to get one of them, from where we want to recognize jsDoc
              const type = new TypeResolver(typeNode, this.current, parent, this.context, propertyType).resolve();
              const required = !this.hasFlag(property, ts.SymbolFlags.Optional);
              const comments = property.getDocumentationComment(this.current.typeChecker);
              const description = comments.length ? ts.displayPartsToString(comments) : undefined;
              const initializer = parent?.initializer;
              const def = initializer ? (0, initializer_value_1.getInitializerValue)(initializer, this.current.typeChecker) : parent ? TypeResolver.getDefault(parent) : undefined;
              // Push property
              return {
                name: property.getName(),
                required,
                deprecated: parent
                  ? (0, jsDocUtils_1.isExistJSDocTag)(parent, tag => tag.tagName.text === 'deprecated') || (0, decoratorUtils_1.isDecorator)(parent, identifier => identifier.text === 'Deprecated')
                  : false,
                type,
                default: def,
                // validators are disjunct via types, so it is now OK.
                // if a type not changes while mapping, we need validators
                // if a type changes, then the validators will be not relevant
                validators: (parent ? (0, validatorUtils_1.getPropertyValidators)(parent) : {}) || {},
                description,
                format: parent ? this.getNodeFormat(parent) : undefined,
                example: parent ? this.getNodeExample(parent) : undefined,
                extensions: parent ? this.getNodeExtension(parent) : undefined,
              };
            });
          const objectLiteral = {
            dataType: 'nestedObjectLiteral',
            properties,
          };
          const indexInfos = this.current.typeChecker.getIndexInfosOfType(type);
          const indexTypes = indexInfos.flatMap(indexInfo => {
            const typeNode = this.current.typeChecker.typeToTypeNode(indexInfo.type, undefined, ts.NodeBuilderFlags.NoTruncation);
            if (typeNode.kind === ts.SyntaxKind.NeverKeyword) {
              // { [k: string]: never; }
              return [];
            }
            const type = new TypeResolver(typeNode, this.current, mappedTypeNode, this.context, indexInfo.type).resolve();
            return [type];
          });
          if (indexTypes.length) {
            if (indexTypes.length === 1) {
              objectLiteral.additionalProperties = indexTypes[0];
            } else {
              // { [k: string]: string; } & { [k: number]: number; }
              // A | B is sometimes A type or B type, sometimes optionally accepts both A & B members.
              // Most people & TSOA thinks that A | B can be only A or only B.
              // So we can accept this merge
              //Every additional property key assumed as string
              objectLiteral.additionalProperties = {
                dataType: 'union',
                types: indexTypes,
              };
            }
          }
          return objectLiteral;
        }
        // Known issues & easy to implement: Partial<string>, Partial<never>, ... But I think a programmer not writes types like this
        throw new exceptions_1.GenerateMetadataError(`Unhandled mapped type has found, flags: ${type.flags}`, this.typeNode);
      };
      const referencer = this.getReferencer();
      const result = calcMappedType(referencer);
      return result;
    }
    if (ts.isConditionalTypeNode(this.typeNode)) {
      const referencer = this.getReferencer();
      const resolvedNode = this.current.typeChecker.typeToTypeNode(referencer, undefined, ts.NodeBuilderFlags.NoTruncation);
      return new TypeResolver(resolvedNode, this.current, this.typeNode, this.context, referencer).resolve();
    }
    // keyof & readonly arrays
    if (ts.isTypeOperatorNode(this.typeNode)) {
      return this.resolveTypeOperatorNode(this.typeNode, this.current.typeChecker, this.current, this.context, this.parentNode, this.referencer);
    }
    // Indexed type
    if (ts.isIndexedAccessTypeNode(this.typeNode)) {
      return this.resolveIndexedAccessTypeNode(this.typeNode, this.current.typeChecker, this.current, this.context);
    }
    if (ts.isTemplateLiteralTypeNode(this.typeNode)) {
      const type = this.getReferencer();
      (0, flowUtils_1.throwUnless)(
        type.isUnion() && type.types.every(unionElementType => unionElementType.isStringLiteral()),
        new exceptions_1.GenerateMetadataError(
          `Could not the type of ${this.current.typeChecker.typeToString(this.current.typeChecker.getTypeFromTypeNode(this.typeNode), this.typeNode)}`,
          this.typeNode,
        ),
      );
      // `a${'c' | 'd'}b`
      const stringLiteralEnum = {
        dataType: 'enum',
        enums: type.types.map(stringLiteralType => stringLiteralType.value),
      };
      return stringLiteralEnum;
    }
    if (ts.isParenthesizedTypeNode(this.typeNode)) {
      return new TypeResolver(this.typeNode.type, this.current, this.typeNode, this.context, this.referencer).resolve();
    }
    (0, flowUtils_1.throwUnless)(this.typeNode.kind === ts.SyntaxKind.TypeReference, new exceptions_1.GenerateMetadataError(`Unknown type: ${ts.SyntaxKind[this.typeNode.kind]}`, this.typeNode));
    return this.resolveTypeReferenceNode(this.typeNode, this.current, this.context, this.parentNode);
  }
  resolveTypeOperatorNode(typeNode, typeChecker, current, context, parentNode, referencer) {
    switch (typeNode.operator) {
      case ts.SyntaxKind.KeyOfKeyword: {
        // keyof
        const type = typeChecker.getTypeFromTypeNode(typeNode);
        if (type.isIndexType()) {
          // in case of generic: keyof T. Not handles all possible cases
          const symbol = type.type.getSymbol();
          if (symbol && symbol.getFlags() & ts.TypeFlags.TypeParameter) {
            const typeName = symbol.getEscapedName();
            (0, flowUtils_1.throwUnless)(typeof typeName === 'string', new exceptions_1.GenerateMetadataError(`typeName is not string, but ${typeof typeName}`, typeNode));
            if (context[typeName]) {
              const subResult = new TypeResolver(context[typeName].type, current, parentNode, context).resolve();
              if (subResult.dataType === 'any') {
                return {
                  dataType: 'union',
                  types: [{ dataType: 'string' }, { dataType: 'double' }],
                };
              }
              const properties = subResult.properties?.map(v => v.name);
              (0, flowUtils_1.throwUnless)(properties, new exceptions_1.GenerateMetadataError(`TypeOperator 'keyof' on node which have no properties`, context[typeName].type));
              return {
                dataType: 'enum',
                enums: properties,
              };
            }
          }
        } else if (type.isUnion()) {
          const literals = type.types.filter(t => t.isLiteral());
          const literalValues = [];
          for (const literal of literals) {
            (0, flowUtils_1.throwUnless)(
              typeof literal.value == 'number' || typeof literal.value == 'string',
              new exceptions_1.GenerateMetadataError(`Not handled key Type, maybe ts.PseudoBigInt ${typeChecker.typeToString(literal)}`, typeNode),
            );
            literalValues.push(literal.value);
          }
          if (!literals.length) {
            const length = type.types.length;
            const someStringFlag = type.types.some(t => t.flags === ts.TypeFlags.String);
            const someNumberFlag = type.types.some(t => t.flags === ts.TypeFlags.Number);
            const someSymbolFlag = type.types.some(t => t.flags === ts.TypeFlags.ESSymbol);
            if (someStringFlag && someNumberFlag) {
              if (length === 2 || (length === 3 && someSymbolFlag)) {
                return {
                  dataType: 'union',
                  types: [{ dataType: 'string' }, { dataType: 'double' }],
                };
              }
            }
          }
          // Warn on nonsense (`number`, `typeof Symbol.iterator`)
          if (type.types.find(t => !t.isLiteral()) !== undefined) {
            const problems = type.types.filter(t => !t.isLiteral()).map(t => typeChecker.typeToString(t));
            console.warn(new exceptions_1.GenerateMetaDataWarning(`Skipped non-literal type(s) ${problems.join(', ')}`, typeNode).toString());
          }
          const stringMembers = literalValues.filter(v => typeof v == 'string');
          const numberMembers = literalValues.filter(v => typeof v == 'number');
          if (stringMembers.length && numberMembers.length) {
            return {
              dataType: 'union',
              types: [
                { dataType: 'enum', enums: stringMembers },
                { dataType: 'enum', enums: numberMembers },
              ],
            };
          }
          return {
            dataType: 'enum',
            enums: literalValues,
          };
        } else if (type.isLiteral()) {
          (0, flowUtils_1.throwUnless)(
            typeof type.value == 'number' || typeof type.value == 'string',
            new exceptions_1.GenerateMetadataError(`Not handled indexType, maybe ts.PseudoBigInt ${typeChecker.typeToString(type)}`, typeNode),
          );
          return {
            dataType: 'enum',
            enums: [type.value],
          };
        } else if (this.hasFlag(type, ts.TypeFlags.Never)) {
          throw new exceptions_1.GenerateMetadataError(`TypeOperator 'keyof' on node produced a never type`, typeNode);
        } else if (this.hasFlag(type, ts.TypeFlags.TemplateLiteral)) {
          //Now assumes template literals as string
          console.warn(new exceptions_1.GenerateMetaDataWarning(`Template literals are assumed as strings`, typeNode).toString());
          return {
            dataType: 'string',
          };
        } else if (this.hasFlag(type, ts.TypeFlags.Number)) {
          return {
            dataType: 'double',
          };
        }
        const indexedTypeName = typeChecker.typeToString(typeChecker.getTypeFromTypeNode(typeNode.type));
        throw new exceptions_1.GenerateMetadataError(`Could not determine the keys on ${indexedTypeName}`, typeNode);
      }
      case ts.SyntaxKind.ReadonlyKeyword:
        // Handle `readonly` arrays
        return new TypeResolver(typeNode.type, current, typeNode, context, referencer).resolve();
      default:
        throw new exceptions_1.GenerateMetadataError(`Unknown type: ${ts.SyntaxKind[typeNode.kind]}`, typeNode);
    }
  }
  resolveIndexedAccessTypeNode(typeNode, typeChecker, current, context) {
    const { indexType, objectType } = typeNode;
    if ([ts.SyntaxKind.NumberKeyword, ts.SyntaxKind.StringKeyword].includes(indexType.kind)) {
      // Indexed by keyword
      const isNumberIndexType = indexType.kind === ts.SyntaxKind.NumberKeyword;
      const typeOfObjectType = typeChecker.getTypeFromTypeNode(objectType);
      const type = isNumberIndexType ? typeOfObjectType.getNumberIndexType() : typeOfObjectType.getStringIndexType();
      (0, flowUtils_1.throwUnless)(
        type,
        new exceptions_1.GenerateMetadataError(`Could not determine ${isNumberIndexType ? 'number' : 'string'} index on ${typeChecker.typeToString(typeOfObjectType)}`, typeNode),
      );
      return new TypeResolver(typeChecker.typeToTypeNode(type, objectType, ts.NodeBuilderFlags.NoTruncation), current, typeNode, context).resolve();
    } else if (ts.isLiteralTypeNode(indexType) && (ts.isStringLiteral(indexType.literal) || ts.isNumericLiteral(indexType.literal))) {
      // Indexed by literal
      const hasType = node => node !== undefined && Object.prototype.hasOwnProperty.call(node, 'type');
      const symbol = typeChecker.getPropertyOfType(typeChecker.getTypeFromTypeNode(objectType), indexType.literal.text);
      (0, flowUtils_1.throwUnless)(
        symbol,
        new exceptions_1.GenerateMetadataError(`Could not determine the keys on ${typeChecker.typeToString(typeChecker.getTypeFromTypeNode(objectType))}`, typeNode),
      );
      if (hasType(symbol.valueDeclaration) && symbol.valueDeclaration.type) {
        return new TypeResolver(symbol.valueDeclaration.type, current, typeNode, context).resolve();
      }
      const declaration = typeChecker.getTypeOfSymbolAtLocation(symbol, objectType);
      try {
        return new TypeResolver(typeChecker.typeToTypeNode(declaration, objectType, ts.NodeBuilderFlags.NoTruncation), current, typeNode, context).resolve();
      } catch {
        throw new exceptions_1.GenerateMetadataError(
          `Could not determine the keys on ${typeChecker.typeToString(typeChecker.getTypeFromTypeNode(typeChecker.typeToTypeNode(declaration, undefined, ts.NodeBuilderFlags.NoTruncation)))}`,
          typeNode,
        );
      }
    } else if (ts.isTypeOperatorNode(indexType) && indexType.operator === ts.SyntaxKind.KeyOfKeyword) {
      // Indexed by keyof typeof value
      const typeOfObjectType = ts.isParenthesizedTypeNode(objectType) ? objectType.type : objectType;
      const { type: typeOfIndexType } = indexType;
      const isSameTypeQuery = ts.isTypeQueryNode(typeOfObjectType) && ts.isTypeQueryNode(typeOfIndexType) && typeOfObjectType.exprName.getText() === typeOfIndexType.exprName.getText();
      const isSameTypeReference = ts.isTypeReferenceNode(typeOfObjectType) && ts.isTypeReferenceNode(typeOfIndexType) && typeOfObjectType.typeName.getText() === typeOfIndexType.typeName.getText();
      if (isSameTypeQuery || isSameTypeReference) {
        const type = this.getReferencer();
        const node = typeChecker.typeToTypeNode(type, undefined, ts.NodeBuilderFlags.InTypeAlias | ts.NodeBuilderFlags.NoTruncation);
        return new TypeResolver(node, current, typeNode, context, this.referencer).resolve();
      }
    }
    throw new exceptions_1.GenerateMetadataError(`Unknown type: ${ts.SyntaxKind[typeNode.kind]}`, typeNode);
  }
  resolveTypeReferenceNode(typeNode, current, context, parentNode) {
    const { typeName, typeArguments } = typeNode;
    if (typeName.kind !== ts.SyntaxKind.Identifier) {
      return this.getReferenceType(typeNode);
    }
    switch (typeName.text) {
      case 'Date':
        return new dateTransformer_1.DateTransformer(this).transform(parentNode);
      case 'Buffer':
      case 'Readable':
        return { dataType: 'buffer' };
      case 'Array':
        if (typeArguments && typeArguments.length === 1) {
          return {
            dataType: 'array',
            elementType: new TypeResolver(typeArguments[0], current, parentNode, context).resolve(),
          };
        }
        break;
      case 'Promise':
        if (typeArguments && typeArguments.length === 1) {
          return new TypeResolver(typeArguments[0], current, parentNode, context).resolve();
        }
        break;
      case 'String':
        return { dataType: 'string' };
      default:
        if (context[typeName.text]) {
          return new TypeResolver(context[typeName.text].type, current, parentNode, context).resolve();
        }
    }
    return this.getReferenceType(typeNode);
  }
  getLiteralValue(typeNode) {
    switch (typeNode.literal.kind) {
      case ts.SyntaxKind.TrueKeyword:
        return true;
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.StringLiteral:
        return typeNode.literal.text;
      case ts.SyntaxKind.NumericLiteral:
        return parseFloat(typeNode.literal.text);
      case ts.SyntaxKind.NullKeyword:
        return null;
      default:
        (0, flowUtils_1.throwUnless)(
          Object.prototype.hasOwnProperty.call(typeNode.literal, 'text'),
          new exceptions_1.GenerateMetadataError(`Couldn't resolve literal node: ${typeNode.literal.getText()}`),
        );
        return typeNode.literal.text;
    }
  }
  getDesignatedModels(nodes, typeName) {
    /**
     * Model is marked with '@tsoaModel', indicating that it should be the 'canonical' model used
     */
    const designatedNodes = nodes.filter(enumNode => {
      return (0, jsDocUtils_1.isExistJSDocTag)(enumNode, tag => tag.tagName.text === 'tsoaModel');
    });
    if (designatedNodes.length === 0) {
      return nodes;
    }
    (0, flowUtils_1.throwUnless)(
      designatedNodes.length === 1,
      new exceptions_1.GenerateMetadataError(`Multiple models for ${typeName} marked with '@tsoaModel'; '@tsoaModel' should only be applied to one model.`),
    );
    return designatedNodes;
  }
  hasFlag(type, flag) {
    return (type.flags & flag) === flag;
  }
  getReferencer() {
    if (this.referencer) {
      return this.referencer;
    }
    if (this.typeNode.pos !== -1) {
      return this.current.typeChecker.getTypeFromTypeNode(this.typeNode);
    }
    throw new exceptions_1.GenerateMetadataError(`Can not succeeded to calculate referencer type.`, this.typeNode);
  }
  static typeReferenceToEntityName(node) {
    if (ts.isTypeReferenceNode(node)) {
      return node.typeName;
    } else if (ts.isExpressionWithTypeArguments(node)) {
      return node.expression;
    }
    throw new exceptions_1.GenerateMetadataError(`Can't resolve Reference type.`);
  }
  //Generates type name for type references
  calcRefTypeName(type) {
    const getEntityName = type => {
      if (ts.isIdentifier(type)) {
        return type.text;
      }
      return `${getEntityName(type.left)}.${type.right.text}`;
    };
    let name = getEntityName(type);
    if (this.context[name]) {
      //resolve name only interesting if entity is not qualifiedName
      name = this.context[name].name; //Not needed to check unicity, because generic parameters are checked previously
    } else {
      const declarations = this.getModelTypeDeclarations(type);
      //Two possible solutions for recognizing different types:
      // - Add declaration positions into type names (In an order).
      //    - It accepts multiple types with same name, if the code compiles, there would be no conflicts in the type names
      //    - Clear namespaces from type names.
      //    - Horrible changes can be in the routes.ts in case of teamwork,
      //        because source files have paths in the computer where data generation runs.
      // - Use fully namespaced names
      //    - Conflicts can be recognized because of the declarations
      //
      // The second was implemented, it not changes the usual type name formats.
      const oneDeclaration = declarations[0]; //Every declarations should be in the same namespace hierarchy
      const identifiers = name.split('.');
      if (ts.isEnumMember(oneDeclaration)) {
        name = identifiers.slice(identifiers.length - 2).join('.');
      } else {
        name = identifiers.slice(identifiers.length - 1).join('.');
      }
      let actNode = oneDeclaration.parent;
      let isFirst = true;
      const isGlobalDeclaration = mod => mod.name.kind === ts.SyntaxKind.Identifier && mod.name.text === 'global';
      while (!ts.isSourceFile(actNode)) {
        if (!(isFirst && ts.isEnumDeclaration(actNode)) && !ts.isModuleBlock(actNode)) {
          (0, flowUtils_1.throwUnless)(ts.isModuleDeclaration(actNode), new exceptions_1.GenerateMetadataError(`This node kind is unknown: ${actNode.kind}`, type));
          if (!isGlobalDeclaration(actNode)) {
            const moduleName = actNode.name.text;
            name = `${moduleName}.${name}`;
          }
        }
        isFirst = false;
        actNode = actNode.parent;
      }
      const declarationPositions = declarations.map(declaration => ({
        fileName: declaration.getSourceFile().fileName,
        pos: declaration.pos,
      }));
      this.current.CheckModelUnicity(name, declarationPositions);
    }
    return name;
  }
  calcMemberJsDocProperties(arg) {
    const def = TypeResolver.getDefault(arg);
    const isDeprecated = (0, jsDocUtils_1.isExistJSDocTag)(arg, tag => tag.tagName.text === 'deprecated') || (0, decoratorUtils_1.isDecorator)(arg, identifier => identifier.text === 'Deprecated');
    const symbol = this.getSymbolAtLocation(arg.name);
    const comments = symbol ? symbol.getDocumentationComment(this.current.typeChecker) : [];
    const description = comments.length ? ts.displayPartsToString(comments) : undefined;
    const validators = (0, validatorUtils_1.getPropertyValidators)(arg);
    const format = this.getNodeFormat(arg);
    const example = this.getNodeExample(arg);
    const extensions = this.getNodeExtension(arg);
    const isIgnored = (0, jsDocUtils_1.getJSDocTagNames)(arg).some(tag => tag === 'ignore');
    const jsonObj = {
      default: def,
      description,
      validators: validators && Object.keys(validators).length ? validators : undefined,
      format,
      example: example !== undefined ? example : undefined,
      extensions: extensions.length ? extensions : undefined,
      deprecated: isDeprecated ? true : undefined,
      ignored: isIgnored ? true : undefined,
    };
    const keys = Object.keys(jsonObj);
    for (const key of keys) {
      if (jsonObj[key] === undefined) {
        delete jsonObj[key];
      }
    }
    if (Object.keys(jsonObj).length) {
      return JSON.stringify(jsonObj);
    }
    return '';
  }
  //Generates type name for type references
  calcTypeName(arg) {
    if (ts.isLiteralTypeNode(arg)) {
      const literalValue = this.getLiteralValue(arg);
      if (typeof literalValue == 'string') {
        return `'${literalValue}'`;
      }
      if (literalValue === null) {
        return 'null';
      }
      if (typeof literalValue === 'boolean') {
        return literalValue === true ? 'true' : 'false';
      }
      return `${literalValue}`;
    }
    const resolvedType = primitiveTransformer_1.PrimitiveTransformer.resolveKindToPrimitive(arg.kind);
    if (resolvedType) {
      return resolvedType;
    }
    if (ts.isTypeReferenceNode(arg) || ts.isExpressionWithTypeArguments(arg)) {
      const [_, name] = this.calcTypeReferenceTypeName(arg);
      return name;
    } else if (ts.isTypeLiteralNode(arg)) {
      const members = arg.members.map(member => {
        if (ts.isPropertySignature(member)) {
          const name = member.name.text;
          const typeText = this.calcTypeName(member.type);
          return `"${name}"${member.questionToken ? '?' : ''}${this.calcMemberJsDocProperties(member)}: ${typeText}`;
        } else if (ts.isIndexSignatureDeclaration(member)) {
          (0, flowUtils_1.throwUnless)(member.parameters.length === 1, new exceptions_1.GenerateMetadataError(`Index signature parameters length != 1`, member));
          const indexType = member.parameters[0];
          (0, flowUtils_1.throwUnless)(
            // now we can't reach this part of code
            ts.isParameter(indexType),
            new exceptions_1.GenerateMetadataError(`indexSignature declaration parameter kind is not SyntaxKind.Parameter`, indexType),
          );
          (0, flowUtils_1.throwUnless)(!indexType.questionToken, new exceptions_1.GenerateMetadataError(`Question token has found for an indexSignature declaration`, indexType));
          const typeText = this.calcTypeName(member.type);
          const indexName = indexType.name.text;
          const indexTypeText = this.calcTypeName(indexType.type);
          return `["${indexName}": ${indexTypeText}]: ${typeText}`;
        }
        throw new exceptions_1.GenerateMetadataError(`Unhandled member kind has found: ${member.kind}`, member);
      });
      return `{${members.join('; ')}}`;
    } else if (ts.isArrayTypeNode(arg)) {
      const typeName = this.calcTypeName(arg.elementType);
      return `${typeName}[]`;
    } else if (ts.isIntersectionTypeNode(arg)) {
      const memberTypeNames = arg.types.map(type => this.calcTypeName(type));
      return memberTypeNames.join(' & ');
    } else if (ts.isUnionTypeNode(arg)) {
      const memberTypeNames = arg.types.map(type => this.calcTypeName(type));
      return memberTypeNames.join(' | ');
    } else if (ts.isTypeOperatorNode(arg)) {
      const subTypeName = this.calcTypeName(arg.type);
      if (arg.operator === ts.SyntaxKind.KeyOfKeyword) {
        return `keyof ${subTypeName}`;
      } else if (arg.operator === ts.SyntaxKind.ReadonlyKeyword) {
        return `readonly ${subTypeName}`;
      }
      throw new exceptions_1.GenerateMetadataError(`Unknown keyword has found: ${arg.operator}`, arg);
    } else if (ts.isTypeQueryNode(arg)) {
      const subTypeName = this.calcRefTypeName(arg.exprName);
      return `typeof ${subTypeName}`;
    } else if (ts.isIndexedAccessTypeNode(arg)) {
      const objectTypeName = this.calcTypeName(arg.objectType);
      const indexTypeName = this.calcTypeName(arg.indexType);
      return `${objectTypeName}[${indexTypeName}]`;
    } else if (arg.kind === ts.SyntaxKind.UnknownKeyword) {
      return 'unknown';
    } else if (arg.kind === ts.SyntaxKind.AnyKeyword) {
      return 'any';
    } else if (arg.kind === ts.SyntaxKind.NeverKeyword) {
      return 'never';
    } else if (ts.isConditionalTypeNode(arg)) {
      const checkTypeName = this.calcTypeName(arg.checkType);
      const extendsTypeName = this.calcTypeName(arg.extendsType);
      const trueTypeName = this.calcTypeName(arg.trueType);
      const falseTypeName = this.calcTypeName(arg.falseType);
      return `${checkTypeName} extends ${extendsTypeName} ? ${trueTypeName} : ${falseTypeName}`;
    } else if (ts.isParenthesizedTypeNode(arg)) {
      const internalTypeName = this.calcTypeName(arg.type);
      return `(${internalTypeName})`; //Parentheses are not really interesting. The type name generation adds parentheses for the clarity
    }
    const warning = new exceptions_1.GenerateMetaDataWarning(`This kind (${arg.kind}) is unhandled, so the type will be any, and no type conflict checks will made`, arg);
    console.warn(warning.toString());
    return 'any';
  }
  //Generates type name for type references
  calcTypeReferenceTypeName(node) {
    const type = TypeResolver.typeReferenceToEntityName(node);
    const refTypeName = this.calcRefTypeName(type);
    if (Array.isArray(node.typeArguments)) {
      // Add typeArguments for Synthetic nodes (e.g. Record<> in TestClassModel.indexedResponse)
      const argumentsString = node.typeArguments.map(type => this.calcTypeName(type));
      return [type, `${refTypeName}<${argumentsString.join(', ')}>`];
    }
    return [type, refTypeName];
  }
  getReferenceType(node, addToRefTypeMap = true) {
    const [type, name] = this.calcTypeReferenceTypeName(node);
    const refTypeName = this.getRefTypeName(name);
    this.current.CheckExpressionUnicity(refTypeName, name);
    this.context = this.typeArgumentsToContext(node, type);
    const calcReferenceType = () => {
      try {
        const existingType = localReferenceTypeCache[name];
        if (existingType) {
          return existingType;
        }
        if (inProgressTypes[name]) {
          return this.createCircularDependencyResolver(name, refTypeName);
        }
        inProgressTypes[name] = [];
        const declarations = this.getModelTypeDeclarations(type);
        const referenceTypes = [];
        for (const declaration of declarations) {
          if (ts.isTypeAliasDeclaration(declaration)) {
            const referencer = node.pos !== -1 ? this.current.typeChecker.getTypeFromTypeNode(node) : undefined;
            referenceTypes.push(new referenceTransformer_1.ReferenceTransformer(this).transform(declaration, refTypeName, referencer));
          } else if (enumTransformer_1.EnumTransformer.transformable(declaration)) {
            referenceTypes.push(new enumTransformer_1.EnumTransformer(this).transform(declaration, refTypeName));
          } else {
            referenceTypes.push(this.getModelReference(declaration, refTypeName));
          }
        }
        const referenceType = referenceTransformer_1.ReferenceTransformer.merge(referenceTypes);
        this.addToLocalReferenceTypeCache(name, referenceType);
        return referenceType;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`There was a problem resolving type of '${name}'.`);
        throw err;
      }
    };
    const result = calcReferenceType();
    if (addToRefTypeMap) {
      this.current.AddReferenceType(result);
    }
    return result;
  }
  addToLocalReferenceTypeCache(name, refType) {
    if (inProgressTypes[name]) {
      for (const fn of inProgressTypes[name]) {
        fn(refType);
      }
    }
    localReferenceTypeCache[name] = refType;
    delete inProgressTypes[name];
  }
  getModelReference(modelType, refTypeName) {
    const example = this.getNodeExample(modelType);
    const description = this.getNodeDescription(modelType);
    const deprecated =
      (0, jsDocUtils_1.isExistJSDocTag)(modelType, tag => tag.tagName.text === 'deprecated') || (0, decoratorUtils_1.isDecorator)(modelType, identifier => identifier.text === 'Deprecated');
    // Handle toJSON methods
    (0, flowUtils_1.throwUnless)(modelType.name, new exceptions_1.GenerateMetadataError("Can't get Symbol from anonymous class", modelType));
    const type = this.current.typeChecker.getTypeAtLocation(modelType.name);
    const toJSON = this.current.typeChecker.getPropertyOfType(type, 'toJSON');
    if (toJSON && toJSON.valueDeclaration && (ts.isMethodDeclaration(toJSON.valueDeclaration) || ts.isMethodSignature(toJSON.valueDeclaration))) {
      let nodeType = toJSON.valueDeclaration.type;
      if (!nodeType) {
        const signature = this.current.typeChecker.getSignatureFromDeclaration(toJSON.valueDeclaration);
        const implicitType = this.current.typeChecker.getReturnTypeOfSignature(signature);
        nodeType = this.current.typeChecker.typeToTypeNode(implicitType, undefined, ts.NodeBuilderFlags.NoTruncation);
      }
      const type = new TypeResolver(nodeType, this.current).resolve();
      const referenceType = {
        refName: refTypeName,
        dataType: 'refAlias',
        description,
        type,
        validators: {},
        deprecated,
        ...(example && { example }),
      };
      return referenceType;
    }
    const properties = new propertyTransformer_1.PropertyTransformer(this).transform(modelType);
    const additionalProperties = this.getModelAdditionalProperties(modelType);
    const inheritedProperties = this.getModelInheritedProperties(modelType) || [];
    const referenceType = {
      additionalProperties,
      dataType: 'refObject',
      description,
      properties: inheritedProperties,
      refName: refTypeName,
      deprecated,
      ...(example && { example }),
    };
    referenceType.properties = referenceType.properties.concat(properties);
    return referenceType;
  }
  //Generates a name from the original type expression.
  //This function is not invertable, so it's possible, that 2 type expressions have the same refTypeName.
  getRefTypeName(name) {
    const preformattedName = name //Preformatted name handles most cases
      .replace(/<|>/g, '_')
      .replace(/\s+/g, '')
      .replace(/,/g, '.')
      .replace(/'([^']*)'/g, '$1')
      .replace(/"([^"]*)"/g, '$1')
      .replace(/&/g, '-and-')
      .replace(/\|/g, '-or-')
      .replace(/\[\]/g, '-Array')
      .replace(/{|}/g, '_') // SuccessResponse_{indexesCreated-number}_ -> SuccessResponse__indexesCreated-number__
      .replace(/([a-z_0-9]+\??):([a-z]+)/gi, '$1-$2') // SuccessResponse_indexesCreated:number_ -> SuccessResponse_indexesCreated-number_
      .replace(/;/g, '--')
      .replace(/([a-z})\]])\[([a-z]+)\]/gi, '$1-at-$2'); // Partial_SerializedDatasourceWithVersion[format]_ -> Partial_SerializedDatasourceWithVersion~format~_,
    //Safety fixes to replace all characters which are not accepted by swagger ui
    let formattedName = preformattedName.replace(/[^A-Za-z0-9\-._]/g, match => {
      return `_${match.charCodeAt(0)}_`;
    });
    formattedName = formattedName.replace(/92_r_92_n/g, '92_n'); //Windows uses \r\n, but linux uses \n.
    return formattedName;
  }
  createCircularDependencyResolver(refName, refTypeName) {
    const referenceType = {
      dataType: 'refObject',
      refName: refTypeName,
    };
    inProgressTypes[refName].push(realReferenceType => {
      for (const key of Object.keys(realReferenceType)) {
        referenceType[key] = realReferenceType[key];
      }
    });
    return referenceType;
  }
  nodeIsUsable(node) {
    switch (node.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration:
      case ts.SyntaxKind.EnumDeclaration:
      case ts.SyntaxKind.EnumMember:
        return true;
      default:
        return false;
    }
  }
  getModelTypeDeclarations(type) {
    let typeName = type.kind === ts.SyntaxKind.Identifier ? type.text : type.right.text;
    let symbol = this.getSymbolAtLocation(type);
    if (!symbol && type.kind === ts.SyntaxKind.QualifiedName) {
      const fullEnumSymbol = this.getSymbolAtLocation(type.left);
      symbol = fullEnumSymbol.exports?.get(typeName);
    }
    const declarations = symbol?.getDeclarations();
    (0, flowUtils_1.throwUnless)(symbol && declarations, new exceptions_1.GenerateMetadataError(`No declarations found for referenced type ${typeName}.`));
    if (symbol.escapedName !== typeName && symbol.escapedName !== 'default') {
      typeName = symbol.escapedName;
    }
    let modelTypes = declarations.filter(node => {
      return this.nodeIsUsable(node) && node.name?.getText() === typeName;
    });
    (0, flowUtils_1.throwUnless)(modelTypes.length, new exceptions_1.GenerateMetadataError(`No matching model found for referenced type ${typeName}.`));
    if (modelTypes.length > 1) {
      // remove types that are from typescript e.g. 'Account'
      modelTypes = modelTypes.filter(modelType => {
        return modelType.getSourceFile().fileName.replace(/\\/g, '/').toLowerCase().indexOf('node_modules/typescript') <= -1;
      });
      modelTypes = this.getDesignatedModels(modelTypes, typeName);
    }
    return modelTypes;
  }
  getSymbolAtLocation(type) {
    const symbol = this.current.typeChecker.getSymbolAtLocation(type) || type.symbol;
    // resolve alias if it is an alias, otherwise take symbol directly
    return (symbol && this.hasFlag(symbol, ts.SymbolFlags.Alias) && this.current.typeChecker.getAliasedSymbol(symbol)) || symbol;
  }
  getModelAdditionalProperties(node) {
    if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
      const interfaceDeclaration = node;
      const indexMember = interfaceDeclaration.members.find(member => member.kind === ts.SyntaxKind.IndexSignature);
      if (!indexMember) {
        return undefined;
      }
      const indexSignatureDeclaration = indexMember;
      const indexType = new TypeResolver(indexSignatureDeclaration.parameters[0].type, this.current, this.parentNode, this.context).resolve();
      (0, flowUtils_1.throwUnless)(indexType.dataType === 'string', new exceptions_1.GenerateMetadataError(`Only string indexers are supported.`, this.typeNode));
      return new TypeResolver(indexSignatureDeclaration.type, this.current, this.parentNode, this.context).resolve();
    }
    return undefined;
  }
  typeArgumentsToContext(type, targetEntity) {
    let newContext = {};
    const declaration = this.getModelTypeDeclarations(targetEntity);
    const typeParameters = 'typeParameters' in declaration[0] ? declaration[0].typeParameters : undefined;
    if (typeParameters) {
      for (let index = 0; index < typeParameters.length; index++) {
        const typeParameter = typeParameters[index];
        const typeArg = type.typeArguments && type.typeArguments[index];
        let resolvedType;
        let name;
        // Argument may be a forward reference from context
        if (typeArg && ts.isTypeReferenceNode(typeArg) && ts.isIdentifier(typeArg.typeName) && this.context[typeArg.typeName.text]) {
          resolvedType = this.context[typeArg.typeName.text].type;
          name = this.context[typeArg.typeName.text].name;
        } else if (typeArg) {
          resolvedType = typeArg;
        } else if (typeParameter.default) {
          resolvedType = typeParameter.default;
        } else {
          throw new exceptions_1.GenerateMetadataError(`Could not find a value for type parameter ${typeParameter.name.text}`, type);
        }
        newContext = {
          ...newContext,
          [typeParameter.name.text]: {
            type: resolvedType,
            name: name || this.calcTypeName(resolvedType),
          },
        };
      }
    }
    return newContext;
  }
  getModelInheritedProperties(modelTypeDeclaration) {
    let properties = [];
    const heritageClauses = modelTypeDeclaration.heritageClauses;
    if (!heritageClauses) {
      return properties;
    }
    for (const clause of heritageClauses) {
      if (!clause.types) {
        continue;
      }
      for (const t of clause.types) {
        const baseEntityName = t.expression;
        // create subContext
        const resetCtx = this.context;
        this.context = this.typeArgumentsToContext(t, baseEntityName);
        const referenceType = this.getReferenceType(t, false);
        if (referenceType) {
          if (referenceType.dataType === 'refEnum') {
            // since it doesn't have properties to iterate over, then we don't do anything with it
          } else if (referenceType.dataType === 'refAlias') {
            let type = referenceType;
            while (type.dataType === 'refAlias') {
              type = type.type;
            }
            if (type.dataType === 'refObject') {
              properties = [...properties, ...type.properties];
            } else if (type.dataType === 'nestedObjectLiteral') {
              properties = [...properties, ...type.properties];
            }
          } else if (referenceType.dataType === 'refObject') {
            (referenceType.properties || []).forEach(property => properties.push(property));
          } else {
            (0, runtime_1.assertNever)(referenceType);
          }
        }
        // reset subContext
        this.context = resetCtx;
      }
    }
    return properties;
  }
  getNodeDescription(node) {
    const symbol = this.getSymbolAtLocation(node.name);
    if (!symbol) {
      return undefined;
    }
    /**
     * TODO: Workaround for what seems like a bug in the compiler
     * Warrants more investigation and possibly a PR against typescript
     */
    if (node.kind === ts.SyntaxKind.Parameter) {
      // TypeScript won't parse jsdoc if the flag is 4, i.e. 'Property'
      symbol.flags = 0;
    }
    const comments = symbol.getDocumentationComment(this.current.typeChecker);
    if (comments.length) {
      return ts.displayPartsToString(comments);
    }
    return undefined;
  }
  getNodeFormat(node) {
    return (0, jsDocUtils_1.getJSDocComment)(node, 'format');
  }
  getPropertyName(prop) {
    if (ts.isComputedPropertyName(prop.name) && ts.isPropertyAccessExpression(prop.name.expression)) {
      const initializerValue = (0, initializer_value_1.getInitializerValue)(prop.name.expression, this.current.typeChecker);
      if (initializerValue) {
        return initializerValue?.toString();
      }
    }
    return prop.name.text;
  }
  getNodeExample(node) {
    const exampleJSDoc = (0, jsDocUtils_1.getJSDocComment)(node, 'example');
    if (exampleJSDoc) {
      return (0, jsonUtils_1.safeFromJson)(exampleJSDoc);
    }
    return (0, decoratorUtils_1.getNodeFirstDecoratorValue)(node, this.current.typeChecker, dec => dec.text === 'Example');
  }
  getNodeExtension(node) {
    const decorators = this.getDecoratorsByIdentifier(node, 'Extension');
    const extensionDecorator = (0, extension_1.getExtensions)(decorators, this.current);
    const extensionComments = (0, jsDocUtils_1.getJSDocComments)(node, 'extension');
    const extensionJSDoc = extensionComments ? (0, extension_1.getExtensionsFromJSDocComments)(extensionComments) : [];
    return extensionDecorator.concat(extensionJSDoc);
  }
  getDecoratorsByIdentifier(node, id) {
    return (0, decoratorUtils_1.getDecorators)(node, identifier => identifier.text === id);
  }
  static getDefault(node) {
    const defaultStr = (0, jsDocUtils_1.getJSDocComment)(node, 'default');
    if (typeof defaultStr == 'string' && defaultStr !== 'undefined') {
      let textStartCharacter = undefined;
      const inString = () => textStartCharacter !== undefined;
      let formattedStr = '';
      for (let i = 0; i < defaultStr.length; ++i) {
        const actCharacter = defaultStr[i];
        if (inString()) {
          if (actCharacter === textStartCharacter) {
            formattedStr += '"';
            textStartCharacter = undefined;
          } else if (actCharacter === '"') {
            formattedStr += '\\"';
          } else if (actCharacter === '\\') {
            ++i;
            if (i < defaultStr.length) {
              const nextCharacter = defaultStr[i];
              if (['n', 't', 'r', 'b', 'f', '\\', '"'].includes(nextCharacter)) {
                formattedStr += '\\' + nextCharacter;
              } else if (!['v', '0'].includes(nextCharacter)) {
                //\v, \0 characters are not compatible with JSON
                formattedStr += nextCharacter;
              }
            } else {
              formattedStr += actCharacter; // this is a bug, but let the JSON parser decide how to handle it
            }
          } else {
            formattedStr += actCharacter;
          }
        } else {
          if ([`"`, "'", '`'].includes(actCharacter)) {
            textStartCharacter = actCharacter;
            formattedStr += '"';
          } else if (actCharacter === '/' && i + 1 < defaultStr.length && defaultStr[i + 1] === '/') {
            i += 2;
            while (i < defaultStr.length && defaultStr[i] !== '\n') {
              ++i;
            }
          } else {
            formattedStr += actCharacter;
          }
        }
      }
      try {
        const parsed = JSON.parse(formattedStr);
        return parsed;
      } catch (err) {
        throw new exceptions_1.GenerateMetadataError(`JSON could not parse default str: "${defaultStr}", preformatted: "${formattedStr}"\nmessage: "${err?.message || '-'}"`);
      }
    }
    return undefined;
  }
}
exports.TypeResolver = TypeResolver;
//# sourceMappingURL=typeResolver.js.map
