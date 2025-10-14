import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Difficulty, FlashcardService } from './flashcard.service';
import { FakeApiService, Todo } from './fake-api.service';
import { SwPush, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { catchError, concatMap, EMPTY, filter, from, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private flashcardService = inject(FlashcardService);
  private fakeApiService = inject(FakeApiService);

  private swUpdate = inject(SwUpdate);
  #swPush = inject(SwPush);

  constructor() {
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        tap(() => this.showUpdatePopup.set(true)),
      )
      .subscribe();

    // if (this.swPush.isEnabled) {
    //   this.swPush.messages.subscribe((msg) => {
    //     console.log(msg);
    //   });
    // }

    this.subscribe();
  }

  #http = inject(HttpClient);
  #baseUrl = 'https://pwa-backend-mockup.vercel.app'
  // #baseUrl = 'http://192.168.0.107:3000';
  permission = signal<NotificationPermission>('default');

  subscribe() {
    this.requestSubscription().subscribe(() => {
      this.permission.set(Notification.permission);
    });
  }

  // submit() {
  //   this.sendMessage(
  //     this.notificationForm.value.title || '',
  //     this.notificationForm.value.description || ''
  //   ).subscribe()
  // }

  requestSubscription() {
    return from(
      this.#swPush.requestSubscription({
        serverPublicKey:
          'BCktAlsTxEKwTV7scYU-f45yGsPZSdMs9rO0zqEYjxcg5jtWMTJ0oX1iVCyUyoybG8s8q1SnP9XgpmF1YhTCe_U',
      }),
    ).pipe(concatMap((sub) => this.#registerOnServer(sub)));
  }

  #vapidPublicKey() {
    return this.#http.get(`${this.#baseUrl}/vapidPublicKey`, { responseType: 'text' });
  }

  #registerOnServer(params: PushSubscription) {
    return this.#http.post(`${this.#baseUrl}/notifications/subscribe`, params);
  }

  sendMessage(title: string, description: string) {
    return this.#http.post(`${this.#baseUrl}/notifications/send`, { title, description });
  }

  protected readonly title = signal('My JavaScript Flashcards');
  protected readonly isFlipped = signal(false);
  protected readonly showButtons = signal(false);

  // Track displayed card separately for smooth transition
  protected readonly displayedCard = signal(this.flashcardService.currentCard());
  protected readonly displayedSide = signal<'question' | 'answer'>('question');

  readonly currentCard = this.flashcardService.currentCard;
  readonly isLoaded = this.flashcardService.isLoaded;
  readonly Difficulty = Difficulty;
  readonly error = this.flashcardService.error;

  // Signal to hold fetched todos
  readonly todos = signal<Todo[]>([]);

  // Signal to control update popup visibility and info
  readonly showUpdatePopup = signal(false);
  readonly updateInfo = signal<string | null>(null);

  onDifficultySelect(difficulty: Difficulty): void {
    const card = this.currentCard();
    if (!card) return;
    if (this.displayedSide() === 'question') {
      // Flip to show answer
      this.isFlipped.set(true);
      this.showButtons.set(true);
      this.displayedSide.set('answer');
      return;
    }
    // Update card with SM-2 algorithm
    this.flashcardService.updateCardWithSM2(card.id, difficulty);
    // Flip back to question side after animation, then update displayed card
    this.isFlipped.set(false);
    this.showButtons.set(false);
    setTimeout(() => {
      this.flashcardService.nextCard();
      this.displayedCard.set(this.flashcardService.currentCard());
      this.displayedSide.set('question');
    }, 300); // match CSS transition duration
  }

  // Ensure displayedCard stays in sync on reset
  resetProgress(): void {
    this.flashcardService.resetProgress();
    this.isFlipped.set(false);
    this.showButtons.set(false);
    this.displayedCard.set(this.flashcardService.currentCard());
    this.displayedSide.set('question');
  }

  onConfirmUpdate(): void {
    window.location.reload();
  }
}
