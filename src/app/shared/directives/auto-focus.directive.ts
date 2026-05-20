import { Directive, ElementRef, inject, OnInit } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements OnInit {
  private readonly el = inject(ElementRef);

  ngOnInit(): void {
    this.el.nativeElement.focus();
  }
}
