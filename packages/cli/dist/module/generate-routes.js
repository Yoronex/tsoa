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
exports.generateRoutes = void 0;
const metadataGenerator_1 = require('../metadataGeneration/metadataGenerator');
const defaultRouteGenerator_1 = require('../routeGeneration/defaultRouteGenerator');
const fs_1 = require('../utils/fs');
const path = require('path');
async function generateRoutes(
  routesConfig,
  compilerOptions,
  ignorePaths,
  /**
   * pass in cached metadata returned in a previous step to speed things up
   */
  metadata,
  defaultNumberType,
) {
  if (!metadata) {
    metadata = new metadataGenerator_1.MetadataGenerator(
      routesConfig.entryFile,
      compilerOptions,
      ignorePaths,
      routesConfig.controllerPathGlobs,
      routesConfig.rootSecurity,
      defaultNumberType,
    ).Generate();
  }
  const routeGenerator = await getRouteGenerator(metadata, routesConfig);
  await (0, fs_1.fsMkDir)(routesConfig.routesDir, { recursive: true });
  await routeGenerator.GenerateCustomRoutes();
  return metadata;
}
exports.generateRoutes = generateRoutes;
async function getRouteGenerator(metadata, routesConfig) {
  // default route generator for express/koa/hapi
  // custom route generator
  const routeGenerator = routesConfig.routeGenerator;
  if (routeGenerator !== undefined) {
    if (typeof routeGenerator === 'string') {
      try {
        // try as a module import
        const module = await Promise.resolve(`${routeGenerator}`).then(s => __importStar(require(s)));
        return new module.default(metadata, routesConfig);
      } catch (_err) {
        // try to find a relative import path
        const relativePath = path.relative(__dirname, routeGenerator);
        const module = await Promise.resolve(`${relativePath}`).then(s => __importStar(require(s)));
        return new module.default(metadata, routesConfig);
      }
    } else {
      return new routeGenerator(metadata, routesConfig);
    }
  }
  if (routesConfig.middleware !== undefined || routesConfig.middlewareTemplate !== undefined) {
    return new defaultRouteGenerator_1.DefaultRouteGenerator(metadata, routesConfig);
  } else {
    routesConfig.middleware = 'express';
    return new defaultRouteGenerator_1.DefaultRouteGenerator(metadata, routesConfig);
  }
}
//# sourceMappingURL=generate-routes.js.map
