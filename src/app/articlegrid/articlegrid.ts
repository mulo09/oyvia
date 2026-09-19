import {Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {RouterModule} from '@angular/router';
import {Conectionws2} from '../services/conectionws';
import {Newsmodel} from '../models/newsmodel';
import {Filesmodel} from '../models/filesmodels';
import {ArticleService} from '../services/article';
import {provideHttpClient} from '@angular/common/http';
import {ShareButton} from '../share-button/share-button';
import {SITE} from '../site.config';

export type ArticleGridLayout = 'list' | 'feed';

@Component({
  selector: 'app-articlegrid',
  imports: [CommonModule, RouterModule, ShareButton],
  templateUrl: './articlegrid.html',
  styleUrl: './articlegrid.scss',
})
export class Articlegrid implements OnInit {
  HEADERS_POST: any = {
    'Content-Type': 'application/json'
  };
  public editMode: boolean = true;
  public name: string = '';
  public list1: Array<Newsmodel> = [];

  /**
   * Layout used to render the article list.
   *  - `list`: the original alternating full width rows.
   *  - `feed`: Red Bull style compact cards (event-feed-card).
   *
   * Defaults to `feed` (cards view). `restoreLayout()` still lets a returning
   * visitor's saved preference (in localStorage) override this default.
   */
  public layout: ArticleGridLayout = 'feed';

  /** Logo shown on the feed cards, mirroring Red Bull's `--logo` modifier. */
  /**
   * Logo shown on the feed cards, mirroring Red Bull's `--logo` modifier.
   * Rendered at 26x26 css px, so a 96px wide WebP is plenty (2.7 KB instead of
   * the 4.3 MB master PNG that used to be requested here).
   */
  public readonly feedLogo: string = 'assets/images/logoia2-96.webp';
  public readonly siteName: string = SITE.name;

  private static readonly LAYOUT_STORAGE_KEY = 'articlegrid.layout';

  constructor(
    public conectionws: Conectionws2,
    private articleService: ArticleService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.restoreLayout();
    this.getArticleGrid();
  }

  /** Flips between the two layouts and remembers the choice. */
  public toggleLayout(): void {
    this.setLayout(this.layout === 'list' ? 'feed' : 'list');
  }

  public setLayout(layout: ArticleGridLayout): void {
    this.layout = layout;
    this.persistLayout(layout);
  }

  // localStorage is not available during server side rendering, so every
  // access is guarded by an isPlatformBrowser check plus a try/catch for
  // browsers where storage is blocked (private mode, cookie policies...).
  private restoreLayout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const stored = localStorage.getItem(Articlegrid.LAYOUT_STORAGE_KEY);
      if (stored === 'list' || stored === 'feed') {
        this.layout = stored;
      }
    } catch {
      // Ignore: the default layout is good enough.
    }
  }

  private persistLayout(layout: ArticleGridLayout): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(Articlegrid.LAYOUT_STORAGE_KEY, layout);
    } catch {
      // Ignore: persisting the preference is a nice to have.
    }
  }

  getArticleGrid(){
    let params = {};
    console.log('Getting the products list');
    // this.conectionws.setEndpoint('http://www.olasyvientos.es:8070/getarticles');

    this.conectionws.setEndpoint('/api/getarticles');
    this.conectionws
      .sendpost2(params)
      .toPromise()
      .then((data) => {
        this._onSuccess(data);
      })
      .catch((err) => {
        this._onError(err);
      });
  }

  private _onError(error: any): void {
    console.log(error);
  }

  private _onSuccess(data: any): void {
    console.log('Raw API data:', data);
    this.list1 = []; // Clear existing data
    for (const d of (data as any)) {
      let newsmodel: Newsmodel = new Newsmodel(
        d.id,
        d.name,
        d.description,
        Filesmodel.listFromApi(d.files),
        d.date,
        d.author || 'Admin',
        d.category || 'Noticias Surf'
      )
      this.list1.push(newsmodel);
    }
    // Newest first. IDs are assigned sequentially by the backend on creation,
    // so sorting by id descending is a reliable "newest first" order and
    // avoids depending on date parsing/formatting from the API.
    this.list1.sort((a, b) => b.id - a.id);
    // Store articles in the shared service
    this.articleService.setArticles(this.list1);
    console.log('Articles loaded:', this.list1);
    console.log('Total articles:', this.list1.length);

    // Force change detection
    this.cdr.detectChanges();
  }

  public viewDetails(id: number) {
    // Navigation logic can be added here
  }

  public deleteArticle(id: number) {
    let endpoint = '/api/textimage/' + id
    this.conectionws.senddelete(endpoint)
      .toPromise()
      .then(data => {
        // Refresh logic
      })
      .catch(err => {
        this._onError(err);
      });
  }
}
