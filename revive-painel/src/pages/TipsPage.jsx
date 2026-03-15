import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Heart, Dumbbell, Brain, Apple, ChevronDown } from 'lucide-react';
import { glassSurface, screenTransition, staggerContainer, staggerItem } from '../utils/constants';
import { MS_PER_DAY } from '../utils/formatters';

const tips = [
  { category: 'coping', icon: Brain, title: 'Tecnica de respiracao 4-7-8', text: 'Inspire por 4 segundos, segure por 7, expire por 8. Repita 3 vezes. Isso ativa o sistema nervoso parassimpatico e reduz a ansiedade.', color: '#8b5cf6' },
  { category: 'coping', icon: Brain, title: 'Ancoragem sensorial', text: 'Quando sentir vontade, observe 5 coisas que ve, 4 que toca, 3 que ouve, 2 que cheira e 1 que saboreia. Isso traz voce ao presente.', color: '#8b5cf6' },
  { category: 'coping', icon: Brain, title: 'Diario de gatilhos', text: 'Anote situacoes que despertam vontade. Identificar padroes e o primeiro passo para criar estrategias de enfrentamento eficazes.', color: '#8b5cf6' },
  { category: 'coping', icon: Brain, title: 'Regra dos 10 minutos', text: 'Quando sentir vontade, espere 10 minutos antes de agir. A maioria dos impulsos diminui significativamente nesse tempo.', color: '#8b5cf6' },
  { category: 'exercise', icon: Dumbbell, title: 'Caminhada de 15 minutos', text: 'Uma caminhada rapida libera endorfinas e reduz o estresse. Substitua o habito negativo por movimento fisico.', color: '#10b981' },
  { category: 'exercise', icon: Dumbbell, title: 'Yoga para iniciantes', text: '10 minutos de yoga pela manha pode reduzir ansiedade em ate 30%. Comece com posturas simples como postura da montanha.', color: '#10b981' },
  { category: 'exercise', icon: Dumbbell, title: 'Exercicios de forca', text: 'Treinos de forca 3x por semana aumentam a autoestima e a disciplina, habilidades cruciais para a recuperacao.', color: '#10b981' },
  { category: 'mindfulness', icon: Heart, title: 'Meditacao guiada', text: 'Comece com 5 minutos diarios de meditacao. Use apps gratuitos como Insight Timer. A pratica regular fortalece o autocontrole.', color: '#ec4899' },
  { category: 'mindfulness', icon: Heart, title: 'Gratidao diaria', text: 'Antes de dormir, escreva 3 coisas pelas quais e grato. Isso reprograma o cerebro para focar no positivo.', color: '#ec4899' },
  { category: 'mindfulness', icon: Heart, title: 'Corpo scan', text: 'Deite-se e observe cada parte do corpo por 30 segundos. Isso aumenta a consciencia corporal e reduz tensoes acumuladas.', color: '#ec4899' },
  { category: 'nutrition', icon: Apple, title: 'Hidratacao constante', text: 'Beba pelo menos 2L de agua por dia. A desidratacao pode ser confundida com desejo. Mantenha uma garrafa sempre por perto.', color: '#f59e0b' },
  { category: 'nutrition', icon: Apple, title: 'Alimentos anti-estresse', text: 'Banana, castanhas, chocolate amargo e cha de camomila ajudam a regular o humor e reduzir a ansiedade.', color: '#f59e0b' },
  { category: 'nutrition', icon: Apple, title: 'Evite acucar refinado', text: 'Picos e quedas de acucar no sangue podem intensificar desejos. Prefira carboidratos complexos para energia estavel.', color: '#f59e0b' },
];

const categories = [
  { id: 'all', label: 'Todas', icon: Lightbulb },
  { id: 'coping', label: 'Enfrentamento', icon: Brain },
  { id: 'exercise', label: 'Exercicio', icon: Dumbbell },
  { id: 'mindfulness', label: 'Mindfulness', icon: Heart },
  { id: 'nutrition', label: 'Nutricao', icon: Apple },
];

export default function TipsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTip, setExpandedTip] = useState(null);

  const filteredTips = useMemo(() =>
    selectedCategory === 'all' ? tips : tips.filter(t => t.category === selectedCategory),
    [selectedCategory]
  );

  // Tip of the day (based on day of year)
  const tipOfDay = useMemo(() => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / MS_PER_DAY);
    return tips[dayOfYear % tips.length];
  }, []);

  return (
    <motion.div {...screenTransition} className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Dicas de Recuperacao</h2>

      {/* Tip of the Day */}
      <div className={`${glassSurface} rounded-3xl p-6 border-l-4 border-[#7CF6C4]`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#7CF6C4]/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-[#7CF6C4]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-[#7CF6C4] mb-1">Dica do Dia</p>
            <h3 className="text-lg font-semibold text-white mb-2">{tipOfDay.title}</h3>
            <p className="text-white/70 leading-relaxed">{tipOfDay.text}</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                selectedCategory === cat.id
                  ? 'bg-[#1F2A3B] text-white border-slate-600'
                  : 'text-white/60 border-slate-700/60 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tips Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {filteredTips.map((tip, index) => {
          const Icon = tip.icon;
          const isExpanded = expandedTip === index;
          return (
            <motion.div
              key={index}
              variants={staggerItem}
              className={`${glassSurface} rounded-2xl overflow-hidden transition cursor-pointer`}
              onClick={() => setExpandedTip(isExpanded ? null : index)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tip.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: tip.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{tip.title}</h4>
                      {!isExpanded && <p className="text-sm text-white/50 mt-1 line-clamp-1">{tip.text}</p>}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition flex-shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                {isExpanded && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-white/70 leading-relaxed mt-3 ml-13"
                  >
                    {tip.text}
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
