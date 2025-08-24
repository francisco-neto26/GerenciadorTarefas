import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './autenticacao.html',
  styleUrls: ['./autenticacao.css']
})
export class Autenticacao implements OnInit {
  modoLogin = true;
  carregando = false;
  mensagemErro = '';
  mensagemSucesso = '';
  
  formularioAuth: FormGroup;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.formularioAuth = this.criarFormulario();
  }

  ngOnInit(): void {
    // Se o usuário já estiver logado, redireciona para a página principal
    if (this.apiService.obterUsuarioLogado()) {
      this.router.navigate(['/principal']);
    }
  }

  private criarFormulario(): FormGroup {
    return this.formBuilder.group({
      nome: [''],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['']
    });
  }

  private atualizarValidadores(): void {
    const nomeControl = this.formularioAuth.get('nome');
    const confirmarSenhaControl = this.formularioAuth.get('confirmarSenha');

    if (!this.modoLogin) {
      // Modo cadastro - adicionar validadores
      nomeControl?.setValidators([Validators.required]);
      confirmarSenhaControl?.setValidators([Validators.required]);
    } else {
      // Modo login - remover validadores
      nomeControl?.clearValidators();
      confirmarSenhaControl?.clearValidators();
    }

    nomeControl?.updateValueAndValidity();
    confirmarSenhaControl?.updateValueAndValidity();
  }

  alternarModo(): void {
    this.modoLogin = !this.modoLogin;
    this.limparMensagens();
    this.limparFormulario();
    this.atualizarValidadores();
  }

  onSubmit(): void {
    this.limparMensagens();

    // Validações básicas do formulário
    if (this.formularioAuth.invalid) {
      this.marcarCamposComoTocados();
      this.mensagemErro = 'Por favor, preencha todos os campos obrigatórios corretamente.';
      return;
    }

    // Validação específica para confirmar senha no modo cadastro
    if (!this.modoLogin) {
      const senha = this.formularioAuth.get('senha')?.value;
      const confirmarSenha = this.formularioAuth.get('confirmarSenha')?.value;
      
      if (senha !== confirmarSenha) {
        this.mensagemErro = 'Senhas não coincidem.';
        return;
      }
    }

    this.carregando = true;
    const dadosFormulario = this.formularioAuth.value;

    if (this.modoLogin) {
      this.apiService.login(dadosFormulario.email, dadosFormulario.senha).subscribe({
        next: (response) => {
          this.carregando = false;
          this.mensagemSucesso = response.message;
          this.apiService.definirUsuario(response.usuario);
          setTimeout(() => {
            this.router.navigate(['/principal']);
          }, 1000);
        },
        error: (error) => {
          this.carregando = false;
          this.mensagemErro = error.error?.message || 'Erro no login. Tente novamente.';
        }
      });
    } else {
      this.apiService.novoUsuario(dadosFormulario.nome, dadosFormulario.email, dadosFormulario.senha).subscribe({
        next: (response) => {
          this.carregando = false;
          this.mensagemSucesso = response.message;
          this.apiService.definirUsuario(response.usuario);
          setTimeout(() => {
            this.router.navigate(['/principal']);
          }, 1000);
        },
        error: (error) => {
          this.carregando = false;
          this.mensagemErro = error.error?.message || 'Erro no cadastro. Tente novamente.';
        }
      });
    }
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.formularioAuth.controls).forEach(campo => {
      this.formularioAuth.get(campo)?.markAsTouched();
    });
  }

  private limparMensagens(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  private limparFormulario(): void {
    this.formularioAuth.reset();
  }

  // Métodos auxiliares para o template
  obterErrosCampo(nomeCampo: string): string {
    const campo = this.formularioAuth.get(nomeCampo);
    
    if (campo?.errors && campo.touched) {
      if (campo.errors['required']) {
        return `${this.obterNomeCampoFormatado(nomeCampo)} é obrigatório.`;
      }
      if (campo.errors['email']) {
        return 'Digite um e-mail válido.';
      }
      if (campo.errors['minlength']) {
        return `Senha deve ter pelo menos ${campo.errors['minlength'].requiredLength} caracteres.`;
      }
    }
    
    return '';
  }

  private obterNomeCampoFormatado(nomeCampo: string): string {
    const nomes: { [key: string]: string } = {
      'nome': 'Nome',
      'email': 'E-mail',
      'senha': 'Senha',
      'confirmarSenha': 'Confirmação de senha'
    };
    return nomes[nomeCampo] || nomeCampo;
  }

  campoTemErro(nomeCampo: string): boolean {
    const campo = this.formularioAuth.get(nomeCampo);
    return !!(campo?.errors && campo.touched);
  }
}