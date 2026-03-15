import React, { useState } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { moodOptions } from '../../utils/constants';

const SelectHumor = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  const opcoes = moodOptions.map(o => ({
    ...o,
    fullLabel: `${o.emoji} ${o.label}`
  }));

  const opcaoSelecionada = opcoes.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-left flex items-center justify-between hover:bg-white/20 focus:outline-none focus:border-[#7CF6C4] focus:bg-white/15 transition"
      >
        <span>{opcaoSelecionada ? opcaoSelecionada.fullLabel : label}</span>
        <ChevronDown className={`w-5 h-5 text-white/60 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#2D3250] border border-white/20 rounded-xl shadow-2xl z-10 overflow-hidden">
          {opcoes.map((opcao) => (
            <button
              key={opcao.value}
              type="button"
              onClick={() => {
                onChange(opcao.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition border-b border-white/10 last:border-b-0 ${
                value === opcao.value
                  ? 'bg-[#7CF6C4]/25 text-white'
                  : 'text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span className="text-2xl">{opcao.emoji}</span>
              <span className="font-medium">{opcao.label}</span>
              {value === opcao.value && <CheckCircle className="w-5 h-5 ml-auto text-[#7CF6C4]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectHumor;
