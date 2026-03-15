import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Repeat, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import Card from '../components/ui/Card';
import { glassSurface, screenTransition, moodColors } from '../utils/constants';

export default function CalendarPage() {
  const { allRegistros, recaidas, metas } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRegistros = allRegistros.filter(r => r.data_registro === dateStr);
      const dayRecaidas = recaidas.filter(r => r.data_recaida?.split('T')[0] === dateStr);
      const dayMetas = metas.filter(m => m.concluida && m.data_criacao?.split('T')[0] === dateStr);
      const mood = dayRegistros.length > 0 ? dayRegistros[dayRegistros.length - 1].humor : null;

      days.push({
        day,
        dateStr,
        registros: dayRegistros,
        recaidas: dayRecaidas,
        metas: dayMetas,
        mood,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }
    return days;
  }, [year, month, allRegistros, recaidas, metas]);

  const selectedDayData = selectedDay ? calendarDays.find(d => d && d.dateStr === selectedDay) : null;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <motion.div {...screenTransition} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white capitalize">Calendario</h2>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white/70 hover:text-white hover:bg-slate-800 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-white capitalize min-w-[180px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white/70 hover:text-white hover:bg-slate-800 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`${glassSurface} rounded-3xl p-6`}>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-white/40 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayData, i) => {
            if (!dayData) return <div key={`empty-${i}`} className="aspect-square" />;
            const isSelected = selectedDay === dayData.dateStr;
            return (
              <button
                key={dayData.dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dayData.dateStr)}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center gap-1 transition relative ${
                  isSelected ? 'bg-[#7CF6C4]/20 border border-[#7CF6C4]/50' :
                  dayData.isToday ? 'bg-white/10 border border-white/20' :
                  'hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={`text-sm font-medium ${dayData.isToday ? 'text-[#7CF6C4]' : 'text-white/80'}`}>{dayData.day}</span>
                <div className="flex gap-0.5">
                  {dayData.mood && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: moodColors[dayData.mood] || '#6b7280' }} />
                  )}
                  {dayData.recaidas.length > 0 && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                  {dayData.metas.length > 0 && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bom humor
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Recaida
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Meta concluida
          </div>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${glassSurface} rounded-3xl p-6`}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {new Date(selectedDayData.dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h3>

          {selectedDayData.registros.length > 0 ? (
            <div className="space-y-3">
              {selectedDayData.registros.map((reg, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-[#7CF6C4]" />
                    <span className="text-sm text-white/60">Registro</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[#7CF6C4]/20 text-[#7CF6C4] capitalize">{reg.humor}</span>
                  </div>
                  {reg.gatilhos && <p className="text-sm text-white/60"><strong className="text-white/80">Gatilhos:</strong> {reg.gatilhos}</p>}
                  {reg.conquistas && <p className="text-sm text-white/60"><strong className="text-white/80">Conquistas:</strong> {reg.conquistas}</p>}
                  {reg.observacoes && <p className="text-sm text-white/60"><strong className="text-white/80">Obs:</strong> {reg.observacoes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm">Nenhum registro neste dia.</p>
          )}

          {selectedDayData.recaidas.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedDayData.recaidas.map((rec, i) => (
                <div key={i} className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-rose-300">Recaida registrada{rec.motivo ? `: ${rec.motivo}` : ''}</span>
                </div>
              ))}
            </div>
          )}

          {selectedDayData.metas.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedDayData.metas.map((meta, i) => (
                <div key={i} className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300">Meta concluida: {meta.descricao_meta}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
