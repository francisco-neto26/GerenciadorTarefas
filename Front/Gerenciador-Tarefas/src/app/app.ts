import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { BarraNavegacao } from "./components/barra-navegacao/barra-navegacao";
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BarraNavegacao, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Gerenciador-Tarefas');

  private router = inject(Router);
  private apiService = inject(ApiService);

  // Signals e subscriptions
  private rotaAtual = signal<string>('');
  private routerSubscription?: Subscription;

  // Lista de rotas que NÃO devem mostrar navbar
  private readonly rotasPublicas = ['/login', '/'] as const;

  // Computed signal - função mostrarNavbar()
  mostrarBarraNavegacao = computed(() => {
    const usuarioAutenticado = this.apiService.autenticado();
    const rota = this.rotaAtual();
    const ehRotaPublica = this.rotasPublicas.includes(rota as any);
    
    console.log('Debug navbar:', {
      usuarioAutenticado: usuarioAutenticado,
      rota: rota,
      ehRotaPublica: ehRotaPublica,
      mostrar: usuarioAutenticado && !ehRotaPublica
    });
    
    return usuarioAutenticado && !ehRotaPublica;
  });

  ngOnInit(): void {
    // Monitora mudanças de rota
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Extrai apenas o path principal (remove query params e fragments)
        const rotaLimpa = event.url.split('?')[0].split('#')[0];
        this.rotaAtual.set(rotaLimpa);
        console.log('Rota mudou para:', rotaLimpa);
      });

    // Define rota inicial
    const rotaInicial = this.router.url.split('?')[0].split('#')[0];
    this.rotaAtual.set(rotaInicial);
    console.log('Rota inicial:', rotaInicial);
  }

  ngOnDestroy(): void {
    // Limpa subscription para evitar memory leaks
    this.routerSubscription?.unsubscribe();
  }

}
