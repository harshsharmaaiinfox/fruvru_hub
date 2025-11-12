import { Component, Input, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Params } from '../../../../../../shared/interface/core.interface';
import { CategoryState } from '../../../../../../shared/state/category.state';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Category, CategoryModel } from '../../../../../../shared/interface/category.interface';

@Component({
  selector: 'app-collection-filter',
  templateUrl: './collection-filter.component.html',
  styleUrls: ['./collection-filter.component.scss']
})
export class CollectionFilterComponent implements OnChanges {

  @Input() filter: Params;
  @Select(CategoryState.category) category$: Observable<CategoryModel>;
  public filters: string[];
  public categories: Category[];

  public filtersObj: { [key: string]: string[] } = {
    category: [],
    brand: [],
    tag: [],
    rating: [],
    price: [],
    attribute: []
  };

  constructor(private route: ActivatedRoute,
    private router: Router) {
    this.category$.subscribe(res => this.categories = res.data.filter(category => category.type == 'product'));
  }

  ngOnChanges() {
    this.filtersObj = {
      category: this.splitFilter('category'),
      brand: this.splitFilter('brand'),
      tag: this.splitFilter('tag'),
      rating: this.splitFilter('rating'),
      price: this.splitFilter('price'),
      attribute: this.splitFilter('attribute')
    };

    this.filters = this.mergeFilters();
  }

  remove(tag: string) {
    Object.keys(this.filtersObj).forEach((key) => {
      this.filtersObj[key] = this.filtersObj[key].filter((val: string) => {
        if (key === 'rating') {
          return val !== tag.replace(/^rating /, '');
        }
        if (key === 'category') {
          // Convert category name back to slug for comparison
          const categorySlug = this.getCategorySlug(tag);
          return val !== categorySlug;
        }
        return val !== tag;
      });
    });

    this.filters = this.mergeFilters();

    const params: Params = {};
    Object.keys(this.filtersObj).forEach((key) => {
      params[key] = this.filtersObj[key].length ? this.filtersObj[key]?.join(',') : null;
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
  }

  clear() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: null,
      skipLocationChange: false
    });
  }

  private splitFilter(filterKey: keyof Params): string[] {
    const value = this.filter && this.filter[filterKey];
    if (!value) return [];
    // value can be a comma-separated string or an array (repeated query params)
    if (Array.isArray(value)) return value.slice();
    if (typeof value === 'string') return value.length ? value.split(',') : [];
    return [];
  }

  private mergeFilters(): string[] {
    return [
      ...this.filtersObj['category'].map(slug => this.getCategoryName(slug)),
      ...this.filtersObj['brand'],
      ...this.filtersObj['tag'],
      ...this.filtersObj['rating'].map(val => val.startsWith('rating ') ? val : `rating ${val}`),
      ...this.filtersObj['price'],
      ...this.filtersObj['attribute']
    ];
  }

  private getCategoryName(slug: string): string {
    const category = this.categories?.find(cat => cat.slug === slug);
    return category ? category.name : slug;
  }

  private getCategorySlug(name: string): string {
    const category = this.categories?.find(cat => cat.name === name);
    return category ? category.slug : name;
  }
}
