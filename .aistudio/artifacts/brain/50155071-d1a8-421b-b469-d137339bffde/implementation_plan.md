# Plano de Implementação — Auditoria de Erros e Login Automático por Dispositivo

## 1. Visão Geral do Objetivo
Realizar uma correção abrangente de inconsistências técnicas identificadas em todo o projeto e implementar o **Vínculo Inteligente de Dispositivos por Perfil com Login Automático** para todos os usuários cadastrados no Beto da Fruta (**Administradores**: Charles, Amanda e Beto; **Operacionais**: Lucas, Rafael, Bianca, Adriana, Vanessa e Rita).

---

## 2. Diagnóstico Completo do Projeto & Correções Planejadas

Durante a auditoria de ponta a ponta do código, foram identificados os seguintes problemas e pontos de melhoria que serão resolvidos:

1. **Bloqueio de Diálogos Nativos (`window.confirm` / `window.alert`)**:
   - **Problema**: Em `DailyRoutinesTab.tsx` (exclusão de rotinas manuais e restauração de turno) e `PurchaseList.tsx` / `Header.tsx`, o uso de `confirm()` nativo do navegador falha ou é bloqueado em ambientes WebView/iFrame e celulares.
   - **Correção**: Substituir todos os `confirm()` por botões de confirmação visual em duas etapas ("Confirmar?" / "Cancelar") ou modais próprios integrados na interface.

2. **Falta de Sincronização Automática entre "Rotinas Diárias" e "Quadro de Tarefas"**:
   - **Problema**: Quando um colaborador marca uma atividade como concluída na aba **Rotinas Diárias** ou quando a gestão adiciona uma rotina manual, a aba **Quadro de Tarefas** só atualiza se alguém clicar manualmente no botão "Sincronizar c/ Quadro".
   - **Correção**: Automatizar a sincronização bidirecional em `App.tsx` e `DailyRoutinesTab.tsx` para que qualquer alteração em rotinas diárias atualize imediatamente o Quadro de Tarefas e o Relatório WhatsApp.

3. **Visibilidade de Tarefas Compartilhadas (Auxiliar) no Quadro de Tarefas**:
   - **Problema**: Na aba **Rotinas Diárias**, o colaborador auxiliar (ex: **Bianca** no Expositor C com **Rafael**, ou em rotinas extras) já vê sua atividade. Porém, ao converter para o **Quadro de Tarefas** (`Task`), o objeto `Task` guarda apenas `responsavelId` (titular), ocultando a tarefa para o auxiliar naquela aba.
   - **Correção**: Adicionar o campo `auxiliarId?: string` na interface `Task` (`src/types/index.ts`), propagá-lo no `syncRoutineWithTaskList` (`src/services/routineEngine.ts`) e atualizar o filtro em `src/components/TaskList.tsx` para exibir tarefas onde o colaborador logado seja titular **ou** auxiliar.

4. **Isolamento de Troca de Perfil para Colaboradores Operacionais**:
   - **Problema**: O cabeçalho (`Header.tsx`) permite que colaboradores operacionais abram o modal `UserSwitcherModal` e troquem livremente para o perfil de outro colega.
   - **Correção**: Bloquear a troca livre de perfil para usuários operacionais (**Lucas, Rafael, Bianca, Adriana, Vanessa e Rita**). Apenas Administradores (**Charles, Amanda e Beto**) terão acesso ao painel de alternância rápida e gestão de perfis/dispositivos.

5. **Persistência e Sincronização de Estado entre Dispositivos (`server.ts`)**:
   - **Problema**: Os vínculos de dispositivos e atualizações de perfis ficavam restritos apenas ao `localStorage` isolado de cada navegador.
   - **Correção**: Criar um servidor Express integrado com Vite (`server.ts`) com endpoints REST (`/api/state`, `/api/devices/bind`, `/api/devices/unbind`) e persistência em arquivo JSON no servidor, mantendo `localStorage` como cache rápido e garantindo que os aparelhos vinculados por cada colaborador fiquem visíveis para os administradores em tempo real.

---

## 3. Vínculo de Dispositivos por Perfil & Login Automático

### 3.1. Identificação Única do Aparelho e Registro no Perfil
- **Identificador de Dispositivo (`DeviceId`)**:
  - Cada aparelho/navegador receberá um identificador único persistente (`betodafruta_device_id`) salvo localmente, acompanhado de metadados legíveis do aparelho (ex: `"Android • Chrome"`, `"iPhone • Safari"`, `"Computador Windows • Edge"`), data/hora do vínculo e último acesso.
- **Estrutura no Perfil do Usuário (`User`)**:
  - Manter o campo existente `pinCode` em `User` (`src/types/index.ts`) para todos os usuários e adicionar `dispositivosVinculados?: RegisteredDevice[]` contendo `{ deviceId, nomeAparelho, plataforma, vinculadoEm, ultimoAcesso }`.
- **Colaboradores Oficiais do Sistema e PINs Iniciais Padrão (Editáveis pela Gestão)**:
  - **Administradores**:
    - **Charles** (`USR-01` — Encarregado Geral): PIN `1234`
    - **Amanda** (`USR-02` — Gestão de Reposição): PIN `1234`
    - **Beto** (`USR-03` — Proprietário): PIN `1234`
  - **Operacionais**:
    - **Lucas** (`USR-04` — Reposição & Caixa): PIN `1004`
    - **Rafael** (`USR-05` — Reposição & Caixa): PIN `1005`
    - **Bianca** (`USR-06` — Operadora de Caixa & Reposição): PIN `1006`
    - **Adriana** (`USR-07` — Produção / Grab & Go): PIN `1007`
    - **Vanessa** (`USR-08` — Produção / Grab & Go): PIN `1008`
    - **Rita** (`USR-09` — Limpeza & Auxílio Produção): PIN `1009`
  - A gestão poderá visualizar e alterar o `pinCode` de qualquer colaborador no modal de Gestão de Equipe.

### 3.2. Fluxo de Primeiro Acesso e Login Automático
1. **Primeiro Acesso no Aparelho**:
   - O usuário seleciona seu perfil na tela inicial (`LoginScreen.tsx`) e digita seu **PIN individual de 4 dígitos (`pinCode`)**.
   - Ao autenticar com sucesso, o sistema **vincula automaticamente aquele dispositivo ao perfil do usuário** (salvando no perfil do usuário e no servidor) e exibe uma confirmação de aparelho vinculado.
2. **Próximos Acessos (Login Automático para Todos os Usuários)**:
   - Sempre que o aplicativo for aberto naquele dispositivo (seja por um Administrador — Charles, Amanda, Beto — ou por um Colaborador Operacional — Lucas, Rafael, Bianca, Adriana, Vanessa, Rita), o sistema verifica o `deviceId` atual.
   - Encontrando o vínculo ativo no perfil do usuário, **entra diretamente e automaticamente na conta daquele usuário sem pedir o PIN novamente**, levando-o direto para suas atividades.
   - Um indicador discreto no cabeçalho mostrará `"Aparelho Vinculado"` com o nome do colaborador.

### 3.3. Gestão de Dispositivos Vinculados (Exclusivo para Administradores)
- No modal **Gerenciar Colaboradores e Dispositivos** (`UserSwitcherModal.tsx` acessível pela Gestão):
  - Exibirá a lista de aparelhos vinculados no perfil de cada colaborador (nome do aparelho, sistema operacional e data do último acesso).
  - Permitirá ao administrador **remover/desvincular aparelhos** de um colaborador (caso o funcionário troque de celular) ou editar o PIN de 4 dígitos (`pinCode`) do colaborador.
  - Caso o próprio usuário precise desconectar seu aparelho, o botão **"Desvincular Aparelho"** exigirá confirmação para liberar o dispositivo.

---

## 4. Arquivos a Serem Criados ou Modificados
- `src/types/index.ts` — Inclusão de `RegisteredDevice` e `dispositivosVinculados?: RegisteredDevice[]` em `User`, além de `auxiliarId?: string` em `Task`.
- `src/services/deviceService.ts` *(Novo)* — Geração e leitura do `deviceId`, detecção amigável do modelo/sistema do aparelho (Android, iPhone, Desktop) e verificação de vínculo automático.
- `server.ts` *(Novo)* e `package.json` — API backend para sincronizar usuários, dispositivos vinculados, tarefas, rotinas e compras entre os aparelhos da equipe.
- `src/services/storage.ts` — Migração automática dos colaboradores oficiais (Charles, Amanda, Beto, Lucas, Rafael, Bianca, Adriana, Vanessa e Rita) com seus `pinCode` individuais, persistência dos dispositivos vinculados por perfil e sincronização com a API `/api/state`.
- `src/components/LoginScreen.tsx` — Fluxo de autenticação com PIN de 4 dígitos para todos os usuários no primeiro vínculo e redirecionamento automático quando o dispositivo já estiver reconhecido.
- `src/components/Header.tsx` — Ocultação da troca de perfil para colaboradores operacionais, indicador de dispositivo vinculado e substituição de `confirm()` nativo.
- `src/components/UserSwitcherModal.tsx` — Painel para administradores gerenciarem colaboradores, `pinCode` individuais e lista de dispositivos vinculados por perfil (com opção de desvincular aparelhos).
- `src/components/DailyRoutinesTab.tsx`, `src/components/TaskList.tsx`, `src/services/routineEngine.ts` e `src/App.tsx` — Sincronização automática em tempo real entre Rotinas Diárias e Quadro de Tarefas, suporte a `auxiliarId` no Quadro de Tarefas e remoção de todos os `confirm()` nativos.
