import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FakeApiService {
  private http = inject(HttpClient);
  readonly todo = signal<Todo | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  fetchTodo(id: number = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Todo>(`https://jsonplaceholder.typicode.com/todos/${id}`).subscribe({
      next: (data) => {
        console.log(data)
        this.todo.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to fetch todo.');
        this.loading.set(false);
      }
    });
  }
}


