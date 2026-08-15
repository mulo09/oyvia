import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Conectionws2 } from '../services/conectionws';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  title = '';
  description = '';
  email = '';

  submitting = signal(false);
  success = signal(false);
  error = signal(false);

  constructor(private conectionws: Conectionws2) {}

  onSubmit(form: NgForm) {
    if (form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.success.set(false);
    this.error.set(false);

    this.conectionws
      .sendContactEmail(this.title, this.description, this.email)
      .toPromise()
      .then(() => {
        this.success.set(true);
        this.submitting.set(false);
        form.resetForm();
      })
      .catch(() => {
        this.error.set(true);
        this.submitting.set(false);
      });
  }
}
