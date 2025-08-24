import { Routes } from '@angular/router';
import { Autenticacao } from './components/autenticacao/autenticacao';
import { Tarefas } from './components/tarefas/tarefas';
import { GuardaAutenticacao } from './guards/autenticacao-guard';
import { Principal } from './components/principal/principal';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Autenticacao },
  { path: 'principal', component: Principal, canActivate: [GuardaAutenticacao]  },
  { path: 'tarefas', component: Tarefas, canActivate: [GuardaAutenticacao] },
  { path: '**', redirectTo: '/login' }
];