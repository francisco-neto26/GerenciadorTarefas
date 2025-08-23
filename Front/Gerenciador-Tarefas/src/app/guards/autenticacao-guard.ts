import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api';

//GUARDA PRINCIPAL: Protege rotas que precisam de autenticação
export const GuardaAutenticacao: CanActivateFn = (rota, estado) => {
  const servicoApi = inject(ApiService);
  const roteador = inject(Router);

  const estaLogado = servicoApi.logado();
  
  if (estaLogado) {
    return true; //Usuário autenticado - pode acessar
  } else {
    roteador.navigate(['/auth']); //Não autenticado - redireciona
    return false;
  }
};

// GUARDA COM LOG: Para debug e monitoramento de acesso
export const GuardaAutenticacaoComLog: CanActivateFn = (rota, estado) => {
  const servicoApi = inject(ApiService);
  const roteador = inject(Router);

  const estaLogado = servicoApi.logado();
  const usuarioAtual = servicoApi.usuarioLogado();
  
  console.log('Verificação de Autenticação:', {
    estaLogado,
    usuario: usuarioAtual?.nome || 'Nenhum',
    urlDestino: estado.url,
    parametrosRota: rota.params
  });

  if (estaLogado) {
    console.log('Acesso liberado para:', estado.url);
    return true;
  } else {
    console.log('Acesso negado. Redirecionando para autenticação...');
    roteador.navigate(['/auth'], {
      queryParams: { voltarPara: estado.url } //Salva URL para retorno após login
    });
    return false;
  }
};

//GUARDA COM RETORNO INTELIGENTE: Volta para página original após login
export const GuardaComRetorno: CanActivateFn = (rota, estado) => {
  const servicoApi = inject(ApiService);
  const roteador = inject(Router);

  const estaLogado = servicoApi.logado();

  if (estaLogado) {
    return true;
  }

  //Salva a URL que o usuário tentou acessar
  //No componente de login, após autenticar, pode redirecionar de volta
  roteador.navigate(['/auth'], {
    queryParams: { 
      voltarPara: estado.url,
      origem: 'acesso-negado'
    }
  });
  
  return false;
};

//GUARDA REVERSA: Para páginas que SÓ usuários NÃO logados devem acessar
export const GuardaVisitante: CanActivateFn = () => {
  const servicoApi = inject(ApiService);
  const roteador = inject(Router);

  const estaLogado = servicoApi.logado();

  if (estaLogado) {
    // Se já está logado, redireciona para o dashboard
    console.log('Usuário já autenticado, redirecionando para dashboard');
    roteador.navigate(['/dashboard']);
    return false;
  }

  // Se não está logado, pode acessar páginas de login/registro
  return true;
};

//GUARDA PARA DADOS ESPECÍFICOS: Verifica se usuário tem acesso aos próprios dados
export const GuardaDadosUsuario: CanActivateFn = (rota) => {
  const servicoApi = inject(ApiService);
  const roteador = inject(Router);

  const usuarioLogado = servicoApi.usuarioLogado();
  const idUsuarioRota = rota.params['usuarioId']; // Ex: /usuario/123/tarefas

  // Verifica se está logado
  if (!usuarioLogado) {
    console.log('Usuário não autenticado');
    roteador.navigate(['/auth']);
    return false;
  }

  // Verifica se está tentando acessar dados de outro usuário
  if (idUsuarioRota && parseInt(idUsuarioRota) !== usuarioLogado.id) {
    console.log('Tentativa de acesso não autorizado:', {
      usuarioLogado: usuarioLogado.id,
      usuarioTentandoAcessar: idUsuarioRota
    });
    roteador.navigate(['/nao-autorizado']);
    return false;
  }

  return true;
};

// ========================================
// EXEMPLOS DE USO NAS ROTAS
// ========================================

/*
// Exemplo de como usar no app.routes.ts:

import { Routes } from '@angular/router';
import { 
  GuardaAutenticacao, 
  GuardaVisitante, 
  GuardaComRetorno,
  GuardaDadosUsuario 
} from './guards/guarda-autenticacao';

export const rotas: Routes = [
  //Rota inicial
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  
  //Rotas para visitantes (não logados)
  { 
    path: 'auth', 
    component: AutenticacaoComponent,
    canActivate: [GuardaVisitante] // Se já logado, vai pro dashboard
  },
  { 
    path: 'registro', 
    component: RegistroComponent,
    canActivate: [GuardaVisitante]
  },
  
  //Rotas protegidas (usuários logados)
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [GuardaAutenticacao]
  },
  { 
    path: 'tarefas', 
    component: TarefasComponent,
    canActivate: [GuardaComRetorno] // Com retorno após login
  },
  { 
    path: 'perfil', 
    component: PerfilComponent,
    canActivate: [GuardaAutenticacao]
  },
  
  //Rotas com verificação de dados específicos
  { 
    path: 'usuario/:usuarioId/tarefas', 
    component: TarefasUsuarioComponent,
    canActivate: [GuardaDadosUsuario] // Verifica se pode acessar dados deste usuário
  },
  
  //Rotas de erro
  { path: 'nao-autorizado', component: NaoAutorizadoComponent },
  { path: '**', redirectTo: '/auth' }
];
*/

// ========================================
// UTILITÁRIOS ADICIONAIS
// ========================================

//Função helper para obter URL de retorno dos query params
export function obterUrlRetorno(): string | null {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('voltarPara');
  }
  return null;
}

//Função helper para verificar se o usuário atual pode acessar dados de outro usuário
export function podeAcessarDadosUsuario(servicoApi: ApiService, idUsuarioDestino: number): boolean {
  const usuarioAtual = servicoApi.usuarioLogado();
  return usuarioAtual?.id === idUsuarioDestino;
}