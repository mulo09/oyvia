import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-share-button',
  imports: [CommonModule],
  templateUrl: './share-button.html',
  styleUrl: './share-button.scss',
})
export class ShareButton implements OnInit {
  /** Id of the article to share. Used to build the absolute /article/:id URL. */
  @Input() articleId!: number;
  /** Title of the article, used as the text of the shared message. */
  @Input() title: string = '';

  public canUseNativeShare: boolean = false;
  public fallbackOpen: boolean = false;
  public copied: boolean = false;

  ngOnInit() {
    this.canUseNativeShare =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  get shareUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.location.origin + '/article/' + this.articleId;
  }

  get whatsappUrl(): string {
    return 'https://api.whatsapp.com/send?text=' +
      encodeURIComponent(this.title + ' ' + this.shareUrl);
  }

  get facebookUrl(): string {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(this.shareUrl);
  }

  get twitterUrl(): string {
    return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(this.shareUrl) +
      '&text=' + encodeURIComponent(this.title);
  }

  share(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.canUseNativeShare) {
      navigator
        .share({title: this.title, text: this.title, url: this.shareUrl})
        // The promise rejects when the user simply dismisses the sheet,
        // so the rejection is swallowed on purpose.
        .catch(() => {});
      return;
    }

    this.fallbackOpen = !this.fallbackOpen;
  }

  copyLink(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const url = this.shareUrl;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(url).then(
        () => this.flagCopied(),
        () => this.copyLinkFallback(url)
      );
    } else {
      this.copyLinkFallback(url);
    }
  }

  private copyLinkFallback(url: string) {
    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      this.flagCopied();
    } finally {
      document.body.removeChild(input);
    }
  }

  private flagCopied() {
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}
