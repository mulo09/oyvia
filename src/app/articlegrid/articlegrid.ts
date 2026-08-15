import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {Conectionws2} from '../services/conectionws';
import {Newsmodel} from '../models/newsmodel';
import {Filesmodel} from '../models/filesmodels';
import {ArticleService} from '../services/article';
import {provideHttpClient} from '@angular/common/http';
import {ShareButton} from '../share-button/share-button';

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

  constructor(
    public conectionws: Conectionws2,
    private articleService: ArticleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.getArticleGrid();
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
