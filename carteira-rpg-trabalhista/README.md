# Carteira de RPG Trabalhista

Primeira versão funcional da interface do site, com visual moderno e escuro.

## O que já funciona nesta versão

- Cadastro e login **de demonstração no próprio navegador**.
- Criar campanhas e gerar códigos de convite.
- Entrar em campanha usando um código.
- Criar, editar e excluir fichas de personagens.
- Atributos base: Físico, Carisma, Sabedoria, Presença e Sorte.
- Perícias com níveis de 0 a 5.
- SM de 0 a 10.
- Criar, editar e excluir criaturas.
- Rolagens de 1d12 + modificador e registro de combate.
- Layout adaptado para celular e computador.

## Importante: demonstração x site online

O cadastro desta primeira versão usa `localStorage`, ou seja, os dados ficam apenas no navegador e aparelho em que foram criados. **Não é ainda um sistema real de contas online**: usuários em aparelhos diferentes não compartilham campanhas ou convites. Não use esta versão para guardar dados importantes.

Para cumprir o acesso por conta + convite pela internet, é necessário ligar o projeto a um backend. Uma opção simples é o Supabase (autenticação, banco de dados e regras de acesso). O arquivo `supabase-schema.sql` contém uma estrutura inicial para essa etapa. A integração ainda precisa ser configurada com as credenciais do seu próprio projeto.

## Como abrir

1. Extraia o arquivo ZIP.
2. Abra `index.html` em um navegador moderno.
3. Para melhor experiência, use VS Code com a extensão Live Server e abra a pasta pelo Live Server.

Não é necessário instalar bibliotecas para testar a demonstração local.

## Regras do sistema já consideradas

- Atributos base: Físico, Carisma, Sabedoria, Presença e Sorte.
- Perícias: cinco níveis; os níveis 1, 3 e 5 podem liberar habilidades.
- SM: escala de 10 a 0.
- Combate: reação por turno de inimigo; Bloqueio = 1d12 + Físico; magia usa Bruxaria.
- RM: duas ações distintas. **Aceitar** usa 1d12 + RM para reduzir dano mental pela diferença. **Resistir** usa 1d12 + RM contra uma dificuldade; se falhar, recebe o dano completo.

Os campos de combate e as perícias são uma base inicial. Não inventei as três vertentes de bruxaria nem efeitos de habilidades que ainda precisam ser fechados: esses módulos devem ser completados conforme as regras finais do mestre.

## Próxima etapa recomendada

Configurar Supabase para autenticação real, campanhas compartilhadas, convites por código e permissões de mestre/jogador. Depois, completar a ficha e o motor de combate com as regras definitivas.
