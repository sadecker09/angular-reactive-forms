import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  FormArray,
} from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Customer } from './customer';
import { NumberValidators } from '../shared/number.validator';

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');
  if (emailControl.pristine || confirmControl.pristine) {
    return null;
  }
  if (emailControl.value === confirmControl.value) {
    return null;
  }
  return { match: true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup; // root FormGroup, defines the form model
  customer = new Customer(); // this is the data model
  emailMessage: string;
  private validationMessages = {
    required: 'Please enter your email address',
    email: 'Please enter a valid email address',
  };

  // Create a property for the FormArray to make accessing easier; but instead of normal property, use getter to ensure none of the code accidentally modifies the FormArray
  get addresses(): FormArray {
    // need to cast to FormArray type, otherwise it would be AbstractControl
    return <FormArray>this.customerForm.get('addresses');
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // define the form model (this is not the data model)
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group(
        {
          email: ['', [Validators.required, Validators.email]],
          confirmEmail: ['', Validators.required],
        },
        { validator: emailMatcher }
      ),
      phone: '',
      notification: 'email',
      // todo - bug? validation passes w/ entry of zero
      rating: [null, NumberValidators.range(1, 5)],
      sendCatalog: true,
      addresses: this.fb.array([this.buildAddress()]),
    });

    this.customerForm
      .get('notification')
      .valueChanges.subscribe((value) => this.setNotification(value));

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges
      .pipe(debounceTime(1000))
      .subscribe((value) => this.setMessage(emailControl));
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
    });
  }

  populateTestData(): void {
    this.customerForm.setValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      email: 'jack@torchwood.com',
      sendCatalog: false,
    });
  }

  // could be generalized further to work w/ other controls
  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors)
        .map((key) => this.validationMessages[key])
        .join(' ');
    }
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }
}
