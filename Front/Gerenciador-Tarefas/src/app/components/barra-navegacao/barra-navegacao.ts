import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-barra-navegacao',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './barra-navegacao.html',
  styleUrl: './barra-navegacao.css'
})

export class BarraNavegacao {
  private router = inject(Router);
  private apiService = inject(ApiService);

  // Computed signals para dados do usuário
  usuarioLogado = computed(() => this.apiService.usuarioLogado());
  nomeUsuario = computed(() => this.usuarioLogado()?.nome || '');
  emailUsuario = computed(() => this.usuarioLogado()?.email || '');

  // Método para fazer logout
  onLogout(): void {
    this.apiService.logout();
    this.router.navigate(['/autenticacao']);
  }

  //Método para navegar para perfil (se implementar)
  onPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}