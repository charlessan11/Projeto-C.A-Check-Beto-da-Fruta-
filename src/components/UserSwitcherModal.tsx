import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  Plus,
  Check,
  Store,
  Smartphone,
  KeyRound,
  Trash2,
  Unlink,
} from 'lucide-react';
import { User, UserProfile } from '../types';
import { AdminPinModal } from './AdminPinModal';
import { getUserPin, updateUserPin } from '../services/storage';
import { getOrCreateDeviceId } from '../services/deviceService';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User, customDeviceName?: string) => void;
  onAddUser: (user: User) => void;
  onUnbindDevice?: (userId: string, deviceId: string) => void;
  onRefreshUsers?: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onAddUser,
  onUnbindDevice,
  onRefreshUsers,
}) => {
  const [adminForPin, setAdminForPin] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<UserProfile>('Operacional');
  const [novoSetor, setNovoSetor] = useState('Frente de Loja');
  const [novoPin, setNovoPin] = useState('1010');

  // Inline PIN editing by Admin
  const [editingPinUserId, setEditingPinUserId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');

  if (!isOpen) return null;

  const currentDeviceId = getOrCreateDeviceId();

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
    const cleanPin = /^\d{4}$/.test(novoPin.trim()) ? novoPin.trim() : '1234';

    const newUser: User = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      nome: novoNome.trim(),
      email: novoEmail.trim() || `${novoNome.toLowerCase().replace(/\s+/g, '.')}@hortifruti.com`,
      perfil: novoPerfil,
      setoresAtuacao: novoSetor,
      setorPadrao: novoSetor,
      avatarCor,
      pinCode: cleanPin,
      dispositivosVinculados: [],
    };

    onAddUser(newUser);
    setShowAddForm(false);
    setNovoNome('');
    setNovoEmail('');
    setNovoPin('1010');
  };

  const handlePickUser = (u: User) => {
    if (u.id === currentUser.id) {
      onClose();
      return;
    }
    if (u.perfil === 'Administrador' && currentUser.perfil !== 'Administrador') {
      setAdminForPin(u);
    } else {
      onSelectUser(u);
      onClose();
    }
  };

  const handleStartEditPin = (u: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPinUserId(u.id);
    setPinInput(getUserPin(u.id));
  };

  const handleSaveUserPin = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (/^\d{4}$/.test(pinInput.trim())) {
      updateUserPin(userId, pinInput.trim());
      setEditingPinUserId(null);
      if (onRefreshUsers) onRefreshUsers();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#09351e] text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gestão de Equipe, PINs &amp; Dispositivos Vinculados
              </h2>
              <p className="text-xs text-slate-500">
                Visualize os aparelhos salvos no perfil de cada colaborador, edite PINs ou alterne a visão.
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

        {/* Profiles & Device Auto-Login explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 text-xs shrink-0">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              Login Automático por Aparelho
            </div>
            <p className="text-[11px] text-emerald-800 mt-1 leading-snug">
              Quando cada colaborador entra com seu PIN pelo celular, o aparelho fica salvo no perfil dele e passa a entrar automaticamente nos próximos acessos.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Isolamento Operacional
            </div>
            <p className="text-[11px] text-amber-800 mt-1 leading-snug">
              Colaboradores operacionais não trocam de perfil livremente. Apenas a Gestão pode desvincular aparelhos ou alterar PINs.
            </p>
          </div>
        </div>

        {/* User list with bound devices */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
          {users.map((u) => {
            const isSelected = u.id === currentUser.id;
            const isAdmin = u.perfil === 'Administrador';
            const userPin = getUserPin(u.id);
            const devices = u.dispositivosVinculados || [];

            return (
              <div
                key={u.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${u.avatarCor}`}
                    >
                      {u.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
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
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-700 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          {devices.length} aparelho(s)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {u.cargoDescricao || u.setoresAtuacao}
                      </p>
                    </div>
                  </div>

                  {/* Right Controls: PIN & Switch Profile */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {editingPinUserId === u.id ? (
                      <div
                        className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          maxLength={4}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          className="w-14 text-center font-mono text-xs font-bold bg-white border border-slate-300 rounded py-1"
                          placeholder="4 díg."
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveUserPin(u.id, e)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPinUserId(null);
                          }}
                          className="px-1.5 py-1 text-slate-500 hover:text-slate-700 text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleStartEditPin(u, e)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                        title="Clique para alterar o PIN de 4 dígitos deste colaborador"
                      >
                        <KeyRound className="w-3 h-3 text-slate-500" />
                        PIN: {userPin}
                      </button>
                    )}

                    {isSelected ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Ativo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePickUser(u)}
                        className="px-3 py-1.5 rounded-xl bg-[#09351e] hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Acessar Perfil
                      </button>
                    )}
                  </div>
                </div>

                {/* Bound Devices List inside Employee Profile */}
                {devices.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-emerald-700" />
                      Aparelhos Salvos no Perfil de {u.nome}:
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {devices.map((dev) => {
                        const isThisDevice = dev.deviceId === currentDeviceId;
                        const formattedDate = new Date(dev.ultimoAcesso || dev.vinculadoEm).toLocaleString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        );

                        return (
                          <div
                            key={dev.deviceId}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <div className="truncate">
                                <span className="font-bold text-slate-800">{dev.nomeAparelho}</span>
                                {isThisDevice && (
                                  <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                    Este Aparelho
                                  </span>
                                )}
                                <span className="block text-[10px] text-slate-500">
                                  ID: {dev.deviceId} • Último acesso: {formattedDate}
                                </span>
                              </div>
                            </div>

                            {onUnbindDevice && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUnbindDevice(u.id, dev.deviceId);
                                }}
                                className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                title="Remover vínculo deste aparelho do perfil do colaborador"
                              >
                                <Unlink className="w-3 h-3" />
                                Desvincular
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add user form toggle */}
        {!showAddForm ? (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
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
          <form onSubmit={handleCreateUser} className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs shrink-0">
            <div className="font-bold text-slate-800">Novo Colaborador da Equipe</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marcos Oliveira"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN (4 dígitos)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={novoPin}
                  onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                />
              </div>
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
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
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
        onSuccess={(admin, customDeviceName) => {
          setAdminForPin(null);
          onSelectUser(admin, customDeviceName);
          onClose();
        }}
      />
    </div>
  );
};
