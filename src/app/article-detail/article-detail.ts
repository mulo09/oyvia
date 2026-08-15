import {Component, OnDestroy, OnInit, ChangeDetectorRef, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {Subscription} from 'rxjs';
import {ArticleService} from '../services/article';
import {Conectionws2} from '../services/conectionws';
import {SeoService} from '../services/seo';
import {SITE, absoluteUrl} from '../site.config';
import {Newsmodel} from '../models/newsmodel';
import {Filesmodel} from '../models/filesmodels';
import {ShareButton} from '../share-button/share-button';

@Component({
  selector: 'app-article-detail',
  imports: [CommonModule, RouterModule, ShareButton],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss',
})
export class ArticleDetail implements OnInit, OnDestroy {
  public article: Newsmodel | undefined;
  public loading: boolean = true;
  public error: boolean = false;
  public relatedArticles: Array<Newsmodel> = [];

  private readonly seo = inject(SeoService);
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    public conectionws: Conectionws2,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // The router reuses this component when navigating between two articles
    // (for example through the "Artículos Relacionados" cards), so ngOnInit
    // runs only once. Reading the id from the paramMap stream instead of from
    // the snapshot keeps the view in sync with the URL.
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const parsed = id !== null ? parseInt(id, 10) : NaN;

      if (isNaN(parsed)) {
        this.article = undefined;
        this.relatedArticles = [];
        this.error = true;
        this.loading = false;
        this.applyErrorMeta();
        this.cdr.markForCheck();
        return;
      }

      // Reset before loading so the previous article is not left on screen.
      this.article = undefined;
      this.relatedArticles = [];
      this.error = false;
      this.loading = true;

      // Placeholder metadata while the article is being fetched; replaced by
      // applyArticleMeta() as soon as the article resolves.
      this.seo.setPageMeta({ url: `/article/${parsed}`, type: 'article' });
      this.loadArticle(parsed);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.seo.setJsonLd(null, 'article-json-ld');
  }

  loadArticle(id: number) {
    // First try to get from service
    this.article = this.articleService.getArticleById(id);

    if (this.article) {
      // Article found in service
      this.loading = false;
      this.applyArticleMeta(this.article);
      this.loadRelatedArticles(id);
    } else {
      // Article not in service, fetch all articles
      this.fetchAllArticles(id);
    }
  }

  fetchAllArticles(articleId: number) {
    const params = {};
    this.conectionws.setEndpoint('/api/getarticles');
    this.conectionws.sendpost2(params)
      .toPromise()
      .then(data => {
        this._onSuccess(data, articleId);
      })
      .catch(err => {
        this._onError(err);
      });
  }

  private _onSuccess(data: any, articleId: number): void {
    const articles: Array<Newsmodel> = [];
    for (const d of (data as any)) {
      let newsmodel: Newsmodel = new Newsmodel(
        d.id,
        d.name,
        d.description,
        Filesmodel.listFromApi(d.files),
        d.date,
        d.author || 'Admin',
        d.category || 'Noticias Surf'
      );
      articles.push(newsmodel);
    }

    // Store in service for future use
    this.articleService.setArticles(articles);

    // Now load the specific article
    this.article = this.articleService.getArticleById(articleId);
    if (!this.article) {
      this.error = true;
      this.applyErrorMeta();
    } else {
      this.applyArticleMeta(this.article);
      this.loadRelatedArticles(articleId);
    }
    this.loading = false;
    // The app runs without zone.js, so state changed inside a promise callback
    // has to be reported to the change detector explicitly.
    this.cdr.markForCheck();
  }

  private _onError(error: any): void {
    console.error('Error loading articles:', error);
    this.error = true;
    this.loading = false;
    this.applyErrorMeta();
    this.cdr.markForCheck();
  }

  /** Title, social preview tags and Article structured data for this post. */
  private applyArticleMeta(article: Newsmodel): void {
    const url = `/article/${article.id}`;
    const description = article.getShortDescription();
    const image = article.getImage1() || article.getThumbnail();
    const absoluteImage = absoluteUrl(image || SITE.defaultImage);

    this.seo.setPageMeta({
      title: article.name,
      description,
      image,
      url,
      type: 'article',
    });

    this.seo.setJsonLd(
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: this.seo.plainText(article.name).slice(0, 110),
            description: this.seo.plainText(description),
            image: [absoluteImage],
            datePublished: article.date,
            articleSection: article.category,
            inLanguage: SITE.lang,
            author: { '@type': 'Person', name: article.author },
            publisher: { '@id': `${SITE.url}/#organization` },
            mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(url) },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Inicio',
                item: absoluteUrl('/'),
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: this.seo.plainText(article.name),
                item: absoluteUrl(url),
              },
            ],
          },
        ],
      },
      'article-json-ld'
    );
  }

  /** Keeps missing or broken articles out of the index. */
  private applyErrorMeta(): void {
    this.seo.setPageMeta({
      title: 'Artículo no encontrado',
      description: 'No se pudo encontrar el artículo solicitado.',
      noindex: true,
    });
    this.seo.setJsonLd(null, 'article-json-ld');
  }

  loadRelatedArticles(currentArticleId: number) {
    const allArticles = this.articleService.getArticles();
    // Filter out the current article
    const otherArticles = allArticles.filter(article => article.id !== currentArticleId);

    // Shuffle and take up to 3 random articles
    const shuffled = this.shuffleArray(otherArticles);
    this.relatedArticles = shuffled.slice(0, 3);
  }

  shuffleArray(array: Array<Newsmodel>): Array<Newsmodel> {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
