import { Pipe, PipeTransform } from '@angular/core';
import { stripHtml } from '../../core/utils/strip-html.util';

@Pipe({ name: 'stripHtml', standalone: true })
export class StripHtmlPipe implements PipeTransform {
  transform(value: string, maxLength?: number): string {
    const text = stripHtml(value ?? '');
    return maxLength && text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }
}
