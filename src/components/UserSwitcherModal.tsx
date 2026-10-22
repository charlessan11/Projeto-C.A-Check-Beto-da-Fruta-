import React, { useState } from 'react';
import { X, ShieldCheck, User as UserIcon, Plus, Check, ShieldAlert, Store, AlertCircle, Lock } from 'lucide-react';
import { User, UserProfile } from '../types';
import { AdminPinModal } from './AdminPinModal';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onAddUser: (user: User) => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onAddUser,
}) => {
  const [adminForPin, setAdminForPin] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<UserProfile>('Operacional');
  const [novoSetor, setNovoSetor] = useState('Frente de Loja');

  if (!isOpen) return null;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const colors = [
      'bg-indigo-600 text-white',
      'bg-violet-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-cyan-600 text-white',
      'bg-rose-600 text-white',
    ];
    const avatarCor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      nome: novoNome.trim(),
      email: novoEmail.trim() || `${novoNome.toLowerCase().replace(/\s+/g, '.')}@hortifruti.com`,
      perfil: novoPerfil,
      setoresAtuacao: novoSetor,
      setorPadrao: novoSetor,
      avatarCor,
    };

    onAddUser(newUser);
    onSelectUser(newUser);
    setShowAddForm(false);
    setNovoNome('');
    setNovoEmail('');
  };

  const handlePickUser = (u: User) => {
    if (u.id === currentUser.id) {
      onClose();
      return;
    }
    if (u.perfil === 'Administrador') {
      setAdminForPin(u);
    } else {
      onSelectUser(u);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Alternar Perfil &amp; Permissões</h2>
              <p className="text-xs text-slate-500">
                Alterne entre Administrador e Operacional para testar a experiência de cada nível.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profiles explanation */}
        <div className="grid grid-cols-2 gap-2.5 my-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Administrador
            </div>
            <p className="text-[11px] text-emerald-800 mt-1 leading-snug">
              Gestão (Charles, Amanda, Beto). Requer PIN de 4 dígitos. CRUD total, compras, relatórios.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <UserIcon className="w-4 h-4 text-amber-700" />
              Operacional
            </div>
            <p className="text-[11px] text-amber-800 mt-1 leading-snug">
              Chão de Loja. Execução de tarefas, rotinas diárias e sugestão de falta na gôndola.
            </p>
          </div>
        </div>

        {/* User list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {users.map((u) => {
            const isSelected = u.id === currentUser.id;
            const isAdmin = u.perfil === 'Administrador';

            return (
              <button
                key={u.id}
                onClick={() => handlePickUser(u)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${u.avatarCor}`}
                  >
                    {u.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{u.nome}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                          isAdmin
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.perfil}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {u.cargoDescricao || u.setoresAtuacao}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Add user form toggle */}
        {!showAddForm ? (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Novo Colaborador
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-800">Novo Colaborador da Equipe</div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Santos"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perfil</label>
                <select
                  value={novoPerfil}
                  onChange={(e) => setNovoPerfil(e.target.value as UserProfile)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Operacional">Operacional (Chão de Loja)</option>
                  <option value="Administrador">Administrador (Gestão)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Setor</label>
                <input
                  type="text"
                  placeholder="Ex: Frente de Loja"
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
              >
                Salvar Colaborador
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Admin PIN authentication modal */}
      <AdminPinModal
        isOpen={!!adminForPin}
        targetAdmin={adminForPin}
        onClose={() => setAdminForPin(null)}
        onSuccess={(admin) => {
          setAdminForPin(null);
          onSelectUser(admin);
          onClose();
        }}
      />
    </div>
  );
};
