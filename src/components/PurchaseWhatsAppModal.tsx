import React, { useState, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  Store,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { PurchaseItem, StoreSettings, User } from '../types';

interface PurchaseWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseItem[];
  settings: StoreSettings;
  currentUser: User;
  onMarkAsSent?: (itemIds: string[]) => void;
}

export const PurchaseWhatsAppModal: React.FC<PurchaseWhatsAppModalProps> = ({
  isOpen,
  onClose,
  purchases,
  settings,
  currentUser,
  onMarkAsSent,
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('todos');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>(
    'Por favor confirmar disponibilidade, cotação e horário previsto de entrega.'
  );
  const [copied, setCopied] = useState(false);

  // Extract unique suppliers
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.fornecedor && p.fornecedor.trim()) {
        set.add(p.fornecedor.trim());
      }
    });
    return Array.from(set).sort();
  }, [purchases]);

  // Filter items based on supplier
  const targetItems = useMemo(() => {
    return purchases.filter((item) => {
      if (selectedSupplier === 'todos') return true;
      return item.fornecedor?.trim() === selectedSupplier;
    });
  }, [purchases, selectedSupplier]);

  // Generate the formatted WhatsApp message
  const generatedMessage = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const supplierHeader =
      selectedSupplier === 'todos'
        ? 'Todos os Fornecedores / Cotação Geral'
        : selectedSupplier;

    let text = `🛒 *PEDIDO DE COMPRA - ${settings.nomeLoja.toUpperCase()}*\n`;
    text += `📅 *Data:* ${today}\n`;
    text += `👤 *Solicitado por:* ${currentUser.nome} (Charles & Amanda)\n`;
    text += `📦 *Fornecedor:* ${supplierHeader}\n`;
    text += `────────────────────\n\n`;
    text += `*ITENS SOLICITADOS:*\n`;

    if (targetItems.length === 0) {
      text += `(Nenhum produto selecionado)\n`;
    } else {
      targetItems.forEach((item, index) => {
        const num = index + 1;
        const qtd = item.quantidadePedida || '1 un';
        const obs = item.observacao ? ` _(${item.observacao})_` : '';
        const forn = selectedSupplier === 'todos' && item.fornecedor ? ` [${item.fornecedor}]` : '';
        text += `${num}. *${item.produto}* — ${qtd}${forn}${obs}\n`;
      });
    }

    text += `\n────────────────────\n`;
    if (customNote.trim()) {
      text += `⚠️ *Observação:* ${customNote.trim()}\n\n`;
    }
    text += `_Mensagem gerada pelo Sistema de Gestão Operacional ${settings.nomeLoja}_`;

    return text;
  }, [targetItems, selectedSupplier, settings.nomeLoja, currentUser.nome, customNote]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    if (onMarkAsSent && targetItems.length > 0) {
      onMarkAsSent(targetItems.map((i) => i.id));
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    let cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone && !cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(generatedMessage);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    if (onMarkAsSent && targetItems.length > 0) {
      onMarkAsSent(targetItems.map((i) => i.id));
    }

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Enviar Lista de Compras via WhatsApp
              </h2>
              <p className="text-xs text-slate-500">
                Formatação automática para fornecedores e distribuidores da feira / Ceasa
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

        {/* Filters & Options */}
        <div className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fornecedor Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                Filtrar por Fornecedor:
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="todos">Todos os Fornecedores ({purchases.length} itens)</option>
                {suppliers.map((sup) => {
                  const count = purchases.filter((p) => p.fornecedor?.trim() === sup).length;
                  return (
                    <option key={sup} value={sup}>
                      {sup} ({count} {count === 1 ? 'item' : 'itens'})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Optional Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp do Fornecedor (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: 11 99999-8888 (ou deixar vazio para escolher no app)"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instrução / Observação no rodapé:
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Entregar até 07h30 da manhã na abertura."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700">
                Prévia da Mensagem ({targetItems.length} {targetItems.length === 1 ? 'produto' : 'produtos'}):
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Pronta para envio
              </span>
            </div>
            <pre className="p-3.5 bg-slate-900 text-emerald-300 rounded-2xl text-xs font-mono max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              {generatedMessage}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Enviando como: <strong className="text-slate-800">{currentUser.nome}</strong> (Charles & Amanda)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copiado para o Teclado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
