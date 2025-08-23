import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Interfaces atualizadas para corresponder ao backend
export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export interface Tarefa {
  id: number;
  usuarioId: number;
  titulo: string;
  descricao: string;
  dataVencimento: string;
  finalizada: boolean;
}

export interface AutenticacaoResponse {
  message: string;
  usuario: Usuario;
}

export interface TarefaResponse {
  message: string;
  tarefa?: Tarefa;
}

export interface NovaTarefaResponse {
  message: string;
  tarefa: Tarefa;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly usuarioLogadoSignal = signal<Usuario | null>(null);
  private readonly autenticadoSignal = signal<boolean>(false);
  readonly usuarioLogado = this.usuarioLogadoSignal.asReadonly();
  readonly autenticado = this.autenticadoSignal.asReadonly();
  readonly logado = computed(() => this.autenticado());

  constructor() {

  }

  // ===== MÉTODOS DE AUTENTICAÇÃO Usuario =====
  novoUsuario(nome: string, email: string, senha: string): Observable<AutenticacaoResponse> {
    return this.http.post<AutenticacaoResponse>(`${this.baseUrl}/novo-usuario`, {
      nome,
      email,
      senha
    }).pipe(
      catchError(this.tratarErros)
    );
  }

  login(email: string, senha: string): Observable<AutenticacaoResponse> {
    return this.http.post<AutenticacaoResponse>(`${this.baseUrl}/login`, {
      email,
      senha
    }).pipe(
      tap(response => {
        if (response.usuario) {
          const usuarioLimpo: Usuario = {
            id: response.usuario.id,
            nome: response.usuario.nome,
            email: response.usuario.email
          };

          this.usuarioLogadoSignal.set(usuarioLimpo);
          this.autenticadoSignal.set(true);
        }
      }),
      catchError(this.tratarErros)
    );
  }

  logout(): void {
    this.usuarioLogadoSignal.set(null);
    this.autenticadoSignal.set(false);
  }

  obterUsuarioLogado(): Usuario | null {
    return this.usuarioLogado();
  }

  // ===== MÉTODOS DE TAREFAS =====
  obterTarefas(usuarioId: number): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(`${this.baseUrl}/tarefas/${usuarioId}`).pipe(
      catchError(this.tratarErros)
    );
  }

  criarTarefa(
    usuarioId: number,
    titulo: string,
    descricao: string,
    dataVencimento: string
  ): Observable<NovaTarefaResponse> {
    return this.http.post<NovaTarefaResponse>(`${this.baseUrl}/tarefas`, {
      usuarioId,
      titulo,
      descricao,
      dataVencimento
    }).pipe(
      catchError(this.tratarErros)
    );
  }

  atualizarTarefa(
    tarefaId: number,
    titulo: string,
    descricao: string,
    dataVencimento: string,
    finalizada: boolean
  ): Observable<TarefaResponse> {
    return this.http.put<TarefaResponse>(`${this.baseUrl}/tarefas/${tarefaId}`, {
      titulo,
      descricao,
      dataVencimento,
      finalizada
    }).pipe(
      catchError(this.tratarErros)
    );
  }

  deletarTarefa(tarefaId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/tarefas/${tarefaId}`).pipe(
      catchError(this.tratarErros)
    );
  }

  // ===== TRATAMENTO DE Erros =====
  private tratarErros = (error: HttpErrorResponse): Observable<never> => {
    let mensagemErro = 'Erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      mensagemErro = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      switch (error.status) {
        case 401:
          mensagemErro = 'Credenciais inválidas';
          this.logout();
          break;
        case 404:
          mensagemErro = 'Recurso não encontrado';
          break;
        case 409:
          mensagemErro = error.error?.message || 'Conflito de dados';
          break;
        case 500:
          mensagemErro = 'Erro interno do servidor';
          break;
        default:
          mensagemErro = error.error?.message || `Erro ${error.status}`;
      }
    }

    console.error('ApiService Error:', error);
    return throwError(() => new Error(mensagemErro));
  };
}