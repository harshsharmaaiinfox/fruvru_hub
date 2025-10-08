import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[numbersOnly]'
})
export class NumbersOnlyDirective {
  
  @Input() numbersOnly: boolean = true;

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.numbersOnly) return;

    // Allow: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(event.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true) ||
        // Allow: home, end, left, right
        (event.keyCode >= 35 && event.keyCode <= 39)) {
      return;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (!this.numbersOnly) return;
    
    event.preventDefault();
    const paste = event.clipboardData?.getData('text');
    if (paste) {
      // Remove any non-numeric characters
      const numbersOnly = paste.replace(/[^0-9]/g, '');
      this.el.nativeElement.value = numbersOnly;
      // Trigger input event to update form control
      this.el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    if (!this.numbersOnly) return;
    
    const value = event.target.value;
    const numbersOnly = value.replace(/[^0-9]/g, '');
    
    if (value !== numbersOnly) {
      event.target.value = numbersOnly;
      // Trigger input event to update form control
      event.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
