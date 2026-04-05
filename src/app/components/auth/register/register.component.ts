import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CustomValidators } from '../../../shared/validator/password-match';
import { Register } from '../../../shared/action/auth.action';
import { Breadcrumb } from '../../../shared/interface/breadcrumb';
import { SettingState } from '../../../shared/state/setting.state';
import { ThemeOptionState } from '../../../shared/state/theme-option.state';
import { Option } from '../../../shared/interface/theme-option.interface';
import { Values } from '../../../shared/interface/setting.interface';
import * as data from '../../../shared/data/country-code';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from '../../../shared/services/auth.service';
import { GetCartItems, SyncCart } from '../../../shared/action/cart.action';
import { CartState } from '../../../shared/state/cart.state';
import { CartAddOrUpdate } from '../../../shared/interface/cart.interface';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  @Select(SettingState.setting) setting$: Observable<Values>;
  @Select(ThemeOptionState.themeOptions) themeOption$: Observable<Option>;

  public form: FormGroup;
  public breadcrumb: Breadcrumb = {
    title: "Sign In",
    items: [{ label: 'Sign In', active: true }]
  }
  public codes = data.countryCodes;
  public tnc = new FormControl(false, [Validators.requiredTrue]);
  public returnUrl: string = '/';

  public reCaptcha: boolean = true;
  

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.form = this.formBuilder.group({
      name: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]*$/)]),
      country_code: new FormControl('91', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      password_confirmation: new FormControl('', [Validators.required]),
      recaptcha: new FormControl(null, Validators.required)
    },{validator : CustomValidators.MatchValidator('password', 'password_confirmation')});

    this.setting$.subscribe(seting => {
      if((seting?.google_reCaptcha && !seting?.google_reCaptcha?.status) || !seting?.google_reCaptcha) {
        this.form.removeControl('recaptcha');
        this.reCaptcha = false;
      } else {
        this.form.setControl('recaptcha', new FormControl(null, Validators.required))
        this.reCaptcha = true;
      }
    });

    this.form.get('country_code')?.disable();
    this.form.controls['phone']?.valueChanges.subscribe((value) => {
      let phoneStr = value ? value.toString().replace(/[^0-9]/g, '') : '';
      // Always keep max 10 digits
      if (phoneStr.length > 10) {
        phoneStr = phoneStr.slice(0, 10);
        this.form.controls['phone'].setValue(phoneStr, { emitEvent: false });
      }
      // Set error if not exactly 10 digits
      if (phoneStr.length !== 10) {
        this.form.controls['phone'].markAsTouched();
        this.form.controls['phone'].setErrors({ invalid: true });
      } else {
        this.form.controls['phone'].setErrors(null);
      }
    });

  }

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const patch: Record<string, string> = {};
      if (params['name']) patch['name'] = params['name'];
      if (params['email']) patch['email'] = params['email'];
      if (params['phone']) patch['phone'] = params['phone'];
      if (params['country_code']) patch['country_code'] = params['country_code'];
      if (Object.keys(patch).length) {
        this.form.patchValue(patch);
      }
      // Store returnUrl from query param (set by checkout when redirecting to register)
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  private afterRegisterSuccess(): void {
    const items = this.store.selectSnapshot(CartState.cartItems);
    const syncCartItems: CartAddOrUpdate[] = [];
    items.forEach(item => {
      if (item) {
        syncCartItems.push({
          id: null,
          product: item?.product,
          product_id: item?.product_id,
          variation: item?.variation ? item.variation : null,
          variation_id: item?.variation_id ? item.variation_id : null,
          quantity: item.quantity
        });
      }
    });
    const go = () => {
      const redirectUrl = this.authService.redirectUrl || this.returnUrl || '/';
      this.router.navigateByUrl(redirectUrl);
      this.authService.redirectUrl = undefined;
    };
    if (syncCartItems.length) {
      this.store.dispatch(new SyncCart(syncCartItems)).subscribe({ complete: () => go() });
    } else {
      this.store.dispatch(new GetCartItems()).subscribe({ complete: () => go() });
    }
  }

  onNameInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove special characters and numbers, keep only letters and spaces
    const cleanValue = value.replace(/[^A-Za-z\s]/g, '');
    
    // Update the input value if it was changed
    if (value !== cleanValue) {
      input.value = cleanValue;
      this.form.controls['name'].setValue(cleanValue);
    }
  }

  onPhoneInput(event: any) {
    const input = event.target;
    const value = input.value;
    // Remove any non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    // Update the input value if it was changed
    if (value !== cleanValue) {
      input.value = cleanValue;
      this.form.controls['phone'].setValue(cleanValue);
    }
  }

  get passwordMatchError() {
    return (
      this.form.getError('mismatch') &&
      this.form.get('password_confirmation')?.touched
    );
  }

  submit() {
    this.form.markAllAsTouched();
    if(this.tnc.invalid){
      return
    }
    if(this.form.valid) {
      const payload = this.form.getRawValue();
      this.store.dispatch(new Register(payload)).subscribe({
        complete: () => {
          this.afterRegisterSuccess();
        }
      });
    }
  }
}
