import type { Node } from 'typescript';
import { Tsoa } from '@tsoa/runtime';
import { Transformer } from './transformer';
export declare class DateTransformer extends Transformer {
  transform(parentNode?: Node): Tsoa.DateType | Tsoa.DateTimeType;
}
