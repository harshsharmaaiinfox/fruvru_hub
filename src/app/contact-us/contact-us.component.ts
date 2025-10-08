import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ContactUsComponent {
  contactForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      consent: [false]
    });
  }

  onSubmit() {
    this.submitted = true;
    
    if (this.contactForm.valid) {
      // Here you would typically send the form data to your backend
      console.log('Form submitted', this.contactForm.value);
      
      // Show success message
      alert('Thank you for your message! We will reach out to you soon.');
      
      // Reset form and submission status
      this.contactForm.reset();
      this.submitted = false;
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
      
      alert('Please fill all required fields correctly before submitting.');
    }
  }

  // Helper method to check if a field is invalid
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field ? (field.invalid && (field.touched || this.submitted)) : false;
  }

  // Input validation methods
  onNameInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove numbers, special characters, keep only letters and spaces
    const cleanValue = value.replace(/[^A-Za-z ]/g, '');
    
    // Update the input value if it was changed
    if (value !== cleanValue) {
      input.value = cleanValue;
      this.contactForm.controls['name'].setValue(cleanValue);
    }
  }

  onSubjectInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove excessive whitespace and limit length
    const cleanValue = value.replace(/\s+/g, ' ').trim().slice(0, 100);
    
    // Update the input value if it was changed
    if (value !== cleanValue) {
      input.value = cleanValue;
      this.contactForm.controls['subject'].setValue(cleanValue);
    }
  }

  onMessageInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove excessive whitespace and limit length
    const cleanValue = value.replace(/\s+/g, ' ').trim().slice(0, 1000);
    
    // Update the input value if it was changed
    if (value !== cleanValue) {
      input.value = cleanValue;
      this.contactForm.controls['message'].setValue(cleanValue);
    }
  }

  // Get specific error messages for better UX
  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && (field.touched || this.submitted)) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern']) {
        return 'Name can only contain letters and spaces';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        if (fieldName === 'name') {
          return `Name must be at least ${requiredLength} characters`;
        } else if (fieldName === 'subject') {
          return `Subject must be at least ${requiredLength} characters`;
        } else if (fieldName === 'message') {
          return `Message must be at least ${requiredLength} characters`;
        }
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        if (fieldName === 'subject') {
          return `Subject cannot exceed ${maxLength} characters`;
        } else if (fieldName === 'message') {
          return `Message cannot exceed ${maxLength} characters`;
        }
      }
    }
    return '';
  }
}
