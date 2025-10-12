import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  easeFactor: number;
  repetitions: number;
  interval: number;
  nextReviewDate: Date;
}

export enum Difficulty {
  Hard = 0,
  Medium = 1,
  Easy = 2
}

@Injectable({
  providedIn: 'root'
})
export class FlashcardService {
  private http = inject(HttpClient);
  private flashcardsData = signal<Flashcard[]>([]);
  private currentCardIndex = signal(0);
  private loaded = signal(false);
  public readonly error = signal<string | null>(null);

  readonly flashcards = computed(() => this.flashcardsData());
  readonly currentCard = computed(() => {
    const cards = this.flashcards();
    const index = this.currentCardIndex();
    return cards.length > 0 ? cards[index] : null;
  });

  readonly isLoaded = computed(() => this.loaded());
  public readonly errorSignal = computed(() => this.error());

  constructor() {
    this.loadFlashcards();
  }

  private loadFlashcards(): void {
    this.http.get<Flashcard[]>('/assets/flashcards1.json').subscribe({
      next: (data) => {
        this.flashcardsData.set(data);
        this.loaded.set(true);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set('Failed to load flashcards. Please try again later.');
        this.loaded.set(false);
      }
    });
  }

  readonly hasMoreCards = computed(() => {
    return this.currentCardIndex() < this.flashcards().length - 1;
  });

  nextCard(): void {
    const currentIndex = this.currentCardIndex();
    const maxIndex = this.flashcards().length - 1;
    if (currentIndex < maxIndex) {
      this.currentCardIndex.set(currentIndex + 1);
    } else {
      this.currentCardIndex.set(0);
    }
  }

  updateCardWithSM2(cardId: number, difficulty: Difficulty): void {
    const cards = this.flashcardsData();
    const cardIndex = cards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    const card = { ...cards[cardIndex] };
    const quality = this.mapDifficultyToQuality(difficulty);
    if (quality >= 3) {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions++;
    } else {
      card.repetitions = 0;
      card.interval = 1;
    }
    card.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (card.easeFactor < 1.3) {
      card.easeFactor = 1.3;
    }
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + card.interval);
    card.nextReviewDate = nextDate;
    const updatedCards = [...cards];
    updatedCards[cardIndex] = card;
    this.flashcardsData.set(updatedCards);
  }

  private mapDifficultyToQuality(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.Hard: return 1;
      case Difficulty.Medium: return 3;
      case Difficulty.Easy: return 5;
      default: return 3;
    }
  }

  resetProgress(): void {
    this.currentCardIndex.set(0);
  }

  public readonly currentCardIndexSignal = computed(() => this.currentCardIndex());
  public readonly totalCardsSignal = computed(() => this.flashcards().length);
}
