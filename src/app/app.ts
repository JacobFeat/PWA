import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FlashcardService, Difficulty } from './flashcard.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private flashcardService = inject(FlashcardService);

  protected readonly title = signal('Flashcards App');
  protected readonly isFlipped = signal(false);
  protected readonly showButtons = signal(false);

  // Track displayed card separately for smooth transition
  protected readonly displayedCard = signal(this.flashcardService.currentCard());
  protected readonly displayedSide = signal<'question' | 'answer'>('question');

  readonly currentCard = this.flashcardService.currentCard;
  readonly isLoaded = this.flashcardService.isLoaded;
  readonly Difficulty = Difficulty;

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
}
