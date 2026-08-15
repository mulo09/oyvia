import { Injectable } from '@angular/core';
import { Newsmodel } from '../models/newsmodel';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private articles: Array<Newsmodel> = [];

  constructor() { }

  setArticles(articles: Array<Newsmodel>) {
    this.articles = articles;
  }

  getArticles(): Array<Newsmodel> {
    return this.articles;
  }

  getArticleById(id: number): Newsmodel | undefined {
    return this.articles.find(article => article.id === id);
  }
}
