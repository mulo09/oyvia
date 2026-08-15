export class Filesmodel{
    private id:number;
    public  thumbnail:string;
    private file:File;
    public  fileName:string;
    private alt:string;
    private date:string = '';



  constructor(id: number, thumbnail: string, file: File, fileName: string, alt: string){
        this.id = id
        this.thumbnail = thumbnail;
        this.file = file
        this.fileName = fileName
        this.alt = alt;
  }

  // /getarticles returns each file as a plain JSON object, which has no class
  // methods on it. Rehydrating here keeps `Newsmodel.fileList` a genuine array
  // of Filesmodel so calls such as getfileName() do not blow up at runtime.
  static fromApi(raw: any): Filesmodel {
    return new Filesmodel(
      raw?.id ?? 0,
      raw?.thumbnail ?? '',
      null as any,
      raw?.fileName ?? '',
      raw?.alt ?? ''
    );
  }

  static listFromApi(raw: any): Array<Filesmodel> {
    return Array.isArray(raw) ? raw.map(file => Filesmodel.fromApi(file)) : [];
  }


  getfile(): File {
    return this.file;
  }

  setFileNull() {
    this.file = null as any;
  }

  getid(): number {
    return this.id;
  }

  getalt(): string {
    return this.alt;
  }


  setid(value: number) {
    this.id = value;
  }

  setfile(value: File | null) {
    this.file = value as File;
  }

  setalt(value: string) {
    this.alt = value;
  }
  setfileName(value: string) {
    this.fileName = value;
  }

  getfileName() : string {
    return this.fileName
  }

  setThumbnail(value: string) {
    this.thumbnail = value;
  }

  getThumbnail() : string {
    return this.thumbnail;
  }

}
