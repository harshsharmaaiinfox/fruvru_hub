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

  public prices = [
    {
      id: 1,
      price: 100,
      text: 'Below',
      value: '100'
    },
    {
      id: 2,
      minPrice: 100,
      maxPrice: 200,
      value: '0-200'
    },
    {
      id: 3,
      minPrice: 200,
      maxPrice: 400,
      value: '200-400'
    },
    {
      id: 4,
      minPrice: 400,
      maxPrice: 600,
      value: '400-600'
    },
    {
      id: 5,
      minPrice: 600,
      maxPrice: 800,
      value: '600-800'
    },
    {
      id: 6,
      minPrice: 800,
      maxPrice: 1000,
      value: '800-1000'
    },
    {
      id: 7,
      price: 1000,
      text: 'Above',
      value: '1000'
    }
  ]

  public selectedPrices: string[] = [];

  constructor(private route: ActivatedRoute,
    private router: Router) {
  }

  ngOnChanges(changes: SimpleChanges) {
    // Normalize incoming query param `price` which can be a string (comma separated)
    // or an array of strings when using repeated query params.
    const priceParam = this.filter?.['price'];

    if (Array.isArray(priceParam)) {
      this.selectedPrices = priceParam.slice();
    } else if (typeof priceParam === 'string' && priceParam.length) {
      this.selectedPrices = priceParam.split(',');
    } else {
      this.selectedPrices = [];
    }

    // ensure uniqueness
    this.selectedPrices = Array.from(new Set(this.selectedPrices));
  }

  applyFilter(event: Event) {
    const target = (event?.target) as HTMLInputElement;
    if (!target) return;

    const value = target.value;
    const checked = !!target.checked;
    const index = this.selectedPrices.indexOf(value);

    if (checked) {
      // add only if not present
      if (index === -1) this.selectedPrices.push(value);
    } else {
      // remove if present
      if (index !== -1) this.selectedPrices.splice(index, 1);
    }

    // navigate with array so Angular emits repeated query params like ?price=200&price=400
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        price: this.selectedPrices.length ? this.selectedPrices : null,
        page: 1
      },
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    });
  }

  // check if the item are selected
  checked(item: string){
    return this.selectedPrices?.indexOf(item) !== -1;
  }

}
