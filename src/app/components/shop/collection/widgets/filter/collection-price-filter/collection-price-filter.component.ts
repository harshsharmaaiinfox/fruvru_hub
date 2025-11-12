import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Params } from '../../../../../../shared/interface/core.interface';

@Component({
  selector: 'app-collection-price-filter',
  templateUrl: './collection-price-filter.component.html',
  styleUrls: ['./collection-price-filter.component.scss']
})
export class CollectionPriceFilterComponent implements OnChanges {

  @Input() filter: Params;

  private readonly presetRanges = [
    { min: 0, max: 100, value: '100' },
    { min: 0, max: 200, value: '0-200' },
    { min: 200, max: 400, value: '200-400' },
    { min: 400, max: 600, value: '400-600' },
    { min: 600, max: 800, value: '600-800' },
    { min: 800, max: 1000, value: '800-1000' },
    { min: 1000, max: 1500, value: '1000-1500' },
    { min: 1500, max: 2000, value: '1500-2000' },
    { min: 2000, max: 3000, value: '2000-3000' },
    { min: 3000, max: 4000, value: '3000-4000' },
    { min: 4000, max: 5000, value: '4000-5000' },
    { min: 5000, max: 7500, value: '5000-7500' },
    { min: 7500, max: 10000, value: '7500-10000' },
    { min: 10000, max: 10000, value: '10000' }
  ] as const;

  private readonly sliderMin = 0;
  private readonly sliderMax = 10000;

  public readonly minLimit = this.sliderMin;
  public readonly maxLimit = this.sliderMax;

  public minValue = this.minLimit;
  public maxValue = this.maxLimit;

  constructor(private route: ActivatedRoute,
    private router: Router) {
  }

  ngOnChanges(changes: SimpleChanges) {
    const range = this.extractRangeFromParam(this.filter?.['price']);
    if (range) {
      this.minValue = range.min;
      this.maxValue = range.max;
    } else {
      this.minValue = this.minLimit;
      this.maxValue = this.maxLimit;
    }
  }

  onMinInput(event: Event) {
    const value = Number((event.target as HTMLInputElement)?.value);
    if (Number.isNaN(value)) {
      return;
    }

    this.minValue = this.clamp(Math.min(value, this.maxValue));
  }

  onMaxInput(event: Event) {
    const value = Number((event.target as HTMLInputElement)?.value);
    if (Number.isNaN(value)) {
      return;
    }

    this.maxValue = this.clamp(Math.max(value, this.minValue));
  }

  onRangeCommit() {
    this.applyRange();
  }

  applyRange() {
    const min = this.clamp(this.minValue);
    const max = this.clamp(this.maxValue);

    const shouldClear = this.isFullRange(min, max);
    const serialized = this.serializeRange(min, max);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        price: shouldClear ? null : serialized,
        page: 1
      },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
  }

  clearRange() {
    this.minValue = this.minLimit;
    this.maxValue = this.maxLimit;
    this.applyRange();
  }

  hasActiveRange(): boolean {
    return !this.isFullRange(this.minValue, this.maxValue);
  }

  get sliderBackground(): string {
    const range = this.maxLimit - this.minLimit;
    const minPercent = ((this.minValue - this.minLimit) / range) * 100;
    const maxPercent = ((this.maxValue - this.minLimit) / range) * 100;

    return `linear-gradient(to right, var(--slider-track-color, #e9ecef) ${minPercent}%, var(--theme-default, #0d6efd) ${minPercent}%, var(--theme-default, #0d6efd) ${maxPercent}%, var(--slider-track-color, #e9ecef) ${maxPercent}%)`;
  }

  private extractRangeFromParam(priceParam: unknown): { min: number; max: number } | null {
    if (!priceParam) {
      return null;
    }

    const normalizeValue = (raw: string): { min: number; max: number } | null => {
      if (!raw?.length) {
        return null;
      }

      if (raw.includes('-')) {
        const [start, end] = raw.split('-').map((point) => Number(point));
        if (Number.isFinite(start) && Number.isFinite(end)) {
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          return {
            min: this.clamp(min),
            max: this.clamp(max)
          };
        }
        return null;
      }

      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) {
        return null;
      }

      if (numeric <= this.minLimit) {
        return { min: this.minLimit, max: this.minLimit };
      }

      if (numeric >= this.maxLimit) {
        return { min: this.maxLimit, max: this.maxLimit };
      }

      return {
        min: this.minLimit,
        max: this.clamp(numeric)
      };
    };

    if (Array.isArray(priceParam)) {
      const ranges = priceParam
        .map((value) => (typeof value === 'string' ? normalizeValue(value) : null))
        .filter((value): value is { min: number; max: number } => !!value);

      if (!ranges.length) {
        return null;
      }

      const min = Math.min(...ranges.map((range) => range.min));
      const max = Math.max(...ranges.map((range) => range.max));
      return { min: this.clamp(min), max: this.clamp(max) };
    }

    if (typeof priceParam === 'string') {
      return normalizeValue(priceParam);
    }

    return null;
  }

  private clamp(value: number): number {
    const bounded = Math.min(this.maxLimit, Math.max(this.minLimit, value));
    return Math.round(bounded);
  }

  private isFullRange(min: number, max: number): boolean {
    return min <= this.minLimit && max >= this.maxLimit;
  }

  private serializeRange(min: number, max: number): string {
    const preset = this.presetRanges.find((range) => range.min === min && range.max === max);
    if (preset) {
      return preset.value;
    }
    return `${min}-${max}`;
  }

}
