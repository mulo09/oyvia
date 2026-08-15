import {Filesmodel} from './filesmodels';

export class Newsmodel {
    id:number;
    public name:string;
    description:string;
    fileList:  Array<Filesmodel>;
    date: string;
    author: string;
    category: string;

  constructor(id: number, name: string, description: string, fileList: Array<Filesmodel>, date: string, author: string, category: string){
        this.id = id
        this.name = name;
        this.description = description;
        this.fileList = fileList;
        this.date = date;
        this.author = author;
        this.category = category;
  }

  getShortDescription() : string {
    const plain = (this.description ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return plain.length > 220 ? plain.substring(0, 219) + '....' : plain;
  }

  // The API returns ISO timestamps such as "2026-07-30T23:16:02.961749Z".
  // Render them as "30 de julio de 2026" and fall back to the raw value
  // when the date cannot be parsed.
  getFormattedDate() : string {
    const raw = (this.date ?? '').toString().trim();
    if (!raw) {
      return '';
    }
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) {
      return raw;
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(parsed);
  }
  // Reads the file name straight off the entry instead of calling
  // getfileName(). The list is normally rehydrated into Filesmodel instances by
  // Filesmodel.listFromApi(), but a plain object arriving from any other path
  // must not be able to throw and blank out the whole page.
  private fileNameAt(index: number) : string {
    const file = this.fileList && this.fileList[index];
    return file ? (file.fileName ?? '') : '';
  }

  getImage1() : string {
    return this.fileNameAt(0);
  }

  // Thumbnails fall back to the full size image when a file has no thumbnail.
  getThumbnail() : string {
    const first = this.fileList && this.fileList[0];
    if (!first) {
      return '';
    }
    return first.thumbnail || first.fileName || '';
  }
  getImage2() : string {
    return this.fileNameAt(1);
  }
  getImage3() : string {
    return this.fileNameAt(2);
  }

}
