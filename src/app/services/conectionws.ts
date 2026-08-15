import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable()
export class Conectionws2 {
  HEADERS_POST: any = {
    'Content-Type': 'application/json',
    'Acces-Control-Allow-Origin': '*'
  };
  BACKEND: string = 'http://MULOHOST:8080/ALMSERVICE/rest/wsService/insertArticle';

  constructor(public http: HttpClient) {
  };

  sendEmail(emailfrom: string, message: string) {
    let url = 'https://us-central1-stoked-coder-157705.cloudfunctions.net/sendEmail';
    let params: URLSearchParams = new URLSearchParams();
    let headers = new Headers({'Content-Type': 'application/json', 'Acces-Control-Allow-Origin': '*'});
    let body: any = {
      to: 'almonedainfo@gmail.com',
      from: emailfrom,
      content: message
    };
    this.sendpost(url, body, this.HEADERS_POST);
  }

  sendContactEmail(title: string, description: string, emailfrom: string) {
    // FormSubmit (https://formsubmit.co) delivers the message straight to the
    // target inbox with no account or API key required. The AJAX endpoint
    // returns JSON so we can react to success/failure in the UI.
    // NOTE: the very first submission triggers a one-time activation email to
    // mulo09@hotmail.com that must be confirmed before messages are delivered.
    let url = 'https://formsubmit.co/ajax/mulo09@hotmail.com';
    let body: any = {
      _subject: title,
      name: emailfrom,
      email: emailfrom,
      title: title,
      message: description,
      _template: 'table',
    };
    let options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    };
    return this.http.post(url, body, options);
  }

  sendpost(url: string, body: any, header: any) {
    this.http.post(url, body, header)
      .toPromise()
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log(err);
      });
  }

  senddelete(url: string) {
    return this.http.delete(url);
  }


  sendpost2(body: any) {
    return this.http.post(this.BACKEND, body, this.HEADERS_POST);
  }

  sendget() {
    return this.http.get(this.BACKEND, this.HEADERS_POST);
  }

  setEndpoint(endpoint: any) {
    console.log('funciono el service');
    this.BACKEND = endpoint;
  }

}
