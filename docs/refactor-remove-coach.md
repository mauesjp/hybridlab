# HybridLab: uso individual

Branch: `refactor/remove-coach-features`.

O app passa a ter somente contas pessoais. `StudentProfile` e a role `Student` continuam como nomes internos. O usuário cria, publica, versiona e executa seus próprios planos; não há delegação de planejamento.

## Alterações

- Removidos CoachProfile, CoachStudentLink, DTOs, enums exclusivos, gerador de código, serviços e registros de injeção de dependência.
- Removidos todos os endpoints de CoachLinks e PlanningAccess, além de POST /api/StrengthPlans/students/{studentId}.
- Leitura e gerenciamento de planos exigem a role Student e um perfil cujo UserId corresponda ao usuário autenticado e cujo ID seja o dono do plano.
- Dashboard consulta somente os planos e sessões do usuário autenticado.
- Cadastro aceita apenas Student, exige nascimento e não oferece seleção de professor ou modalidades. Login, refresh e /Auth/me recusam contas sem a role Student; novos tokens contêm somente essa role.
- Removidos menu, página, tipos e chamadas de vínculos/professores. Dashboard mostra treinos concluídos/parciais, planos ativos e acesso ao peso.
- Mantidos versionamento, imutabilidade dos planos publicados, histórico, execução de treinos, séries, peso, meta, regra diária, média de 7 dias e gráfico.
- Atualizados os testes dos serviços para os endpoints individuais. O teste executado em Node agora fornece a variável de ambiente do Vite explicitamente, sem alterar o comportamento de produção.

## Migration e implantação

Nova migration: `20260929173758_RemoveCoachFeatures`, com Designer e snapshot atualizados. As migrations antigas permanecem para preservar o histórico e permitir a criação de bancos desde o início.

Up remove exclusivamente CoachStudentLinks e Coaches. Não remove usuários de AspNetUsers, perfis Students, planos, versões, sessões, séries ou registros de peso.

O cadastro legado da role Coach e suas associações em Identity permanecem como dados inativos: o app não cria, aceita nem emite essa role. Contas com Student continuam funcionando; contas exclusivamente Coach não conseguem entrar ou renovar sessão. Não há conversão automática, pois esses perfis não possuem a data de nascimento obrigatória. Se alguma dessas pessoas precisar continuar usando a mesma conta, completar seu StudentProfile com dados reais e atribuir Student antes da implantação.

A API já executa Database.MigrateAsync() ao iniciar. Portanto, o próximo deploy do backend aplicará a migration automaticamente. Fazer backup antes: o rollback recria as duas tabelas e o índice, mas não recupera seus registros. Publicar frontend e backend juntos, pois o frontend antigo chama endpoints que deixam de existir.

Nenhuma migration foi aplicada a banco nesta refatoração.

## Validação

- Build do backend: passou, sem avisos ou erros.
- Build de produção do frontend: passou.
- Testes existentes do frontend: 8 aprovados.
- ESLint: passou.
- EF Core: nenhuma alteração pendente entre modelo e snapshot.
- SQL da migration gerado e revisado sem conexão ao banco.

Para repetir os checks a partir da raiz:

```powershell
dotnet build backend/HybridLab.slnx --no-restore
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
```

A verificação offline do EF usou uma factory temporária, já removida. Não foram executados testes de integração com MySQL nem testes visuais no navegador. Antes do deploy, validar em ambiente de teste com dois usuários: cada um só deve acessar seus próprios planos, inclusive ao tentar IDs de outro usuário; criar/publicar/versionar plano, executar treino, consultar histórico e registrar/editar peso.
