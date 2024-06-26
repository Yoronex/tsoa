'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DateTransformer = void 0;
const transformer_1 = require('./transformer');
const jsDocUtils_1 = require('../../utils/jsDocUtils');
class DateTransformer extends transformer_1.Transformer {
  transform(parentNode) {
    if (!parentNode) {
      return { dataType: 'datetime' };
    }
    const tags = (0, jsDocUtils_1.getJSDocTagNames)(parentNode).filter(name => {
      return ['isDate', 'isDateTime'].some(m => m === name);
    });
    if (tags.length === 0) {
      return { dataType: 'datetime' };
    }
    switch (tags[0]) {
      case 'isDate':
        return { dataType: 'date' };
      case 'isDateTime':
        return { dataType: 'datetime' };
      default:
        return { dataType: 'datetime' };
    }
  }
}
exports.DateTransformer = DateTransformer;
//# sourceMappingURL=dateTransformer.js.map
