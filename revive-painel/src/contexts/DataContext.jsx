import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import * as viciosService from '../services/vicios.service';
import * as registrosService from '../services/registros.service';
import * as metasService from '../services/metas.service';
import * as recaidasService from '../services/recaidas.service';
import * as mensagensService from '../services/mensagens.service';
import { calcularTempoDecorrido } from '../utils/formatters';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { token, user } = useAuth();
  const { showToast, setLoading, showConfirm } = useUI();

  const [addictions, setAddictions] = useState([]);
  const [selectedAddiction, setSelectedAddiction] = useState(null);
  const [selectedAddictionRecords, setSelectedAddictionRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [goals, setGoals] = useState([]);
  const [relapses, setRelapses] = useState([]);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  const handleDataError = useCallback((error, userMessage) => {
    console.error(error);
    showToast('error', userMessage);
  }, [showToast]);

  const withLoading = useCallback(async (operation, errorMessage) => {
    setLoading(true);
    try {
      return await operation();
    } catch (error) {
      handleDataError(error, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, handleDataError]);

  const loadAddictions = useCallback(() => withLoading(async () => {
    const data = await viciosService.listarVicios(token);
    const processed = (data.vicios || []).map(addiction => ({
      ...addiction,
      dias_abstinencia: Math.max(0, addiction.dias_abstinencia || 0),
      valor_economizado: Math.max(0, addiction.valor_economizado || 0),
      tempo_formatado: addiction.tempo_formatado || calcularTempoDecorrido(addiction.data_inicio)
    }));
    setAddictions(processed);
  }, 'Nao foi possivel carregar seus vicios.'), [token, withLoading]);

  const loadAddictionDetails = useCallback(async (id) => {
    return await withLoading(async () => {
      const data = await viciosService.buscarVicio(id, token);
      const processedAddiction = {
        ...data.vicio,
        dias_abstinencia: Math.max(0, data.vicio.dias_abstinencia || 0),
        valor_economizado: Math.max(0, data.vicio.valor_economizado || 0),
        tempo_formatado: data.vicio.tempo_formatado || calcularTempoDecorrido(data.vicio.data_inicio)
      };
      setSelectedAddiction(processedAddiction);
      const regData = await registrosService.listarRegistros(id, token);
      setSelectedAddictionRecords(regData.registros || []);
      return processedAddiction;
    }, 'Nao foi possivel carregar os detalhes do vicio.');
  }, [token, withLoading]);

  const loadGoals = useCallback(async () => {
    try {
      const data = await metasService.listarMetas(token);
      setGoals(data.metas || []);
    } catch (error) {
      handleDataError(error, 'Nao foi possivel carregar suas metas.');
    }
  }, [token, handleDataError]);

  const loadRelapses = useCallback(async () => {
    try {
      const data = await recaidasService.listarRecaidas(token);
      setRelapses(data.recaidas || []);
    } catch (error) {
      handleDataError(error, 'Nao foi possivel carregar as recaidas.');
    }
  }, [token, handleDataError]);

  const loadMotivationalMessage = useCallback(async () => {
    try {
      const data = await mensagensService.getMensagemDiaria('geral', token);
      setMotivationalMessage(data.mensagem?.mensagem || 'Voce esta no caminho certo! Continue firme!');
    } catch (error) {
      console.error(error);
      setMotivationalMessage('Cada dia e uma vitoria! Parabens pela sua jornada!');
      showToast('error', 'Nao foi possivel carregar a mensagem do dia.');
    }
  }, [token, showToast]);

  const loadAllRecords = useCallback(async () => {
    try {
      const requests = addictions.map(addiction => registrosService.listarRegistros(addiction.id, token));
      const responses = await Promise.all(requests);
      setAllRecords(responses.flatMap(response => response.registros || []));
    } catch (error) {
      handleDataError(error, 'Nao foi possivel carregar o historico de registros.');
      setAllRecords([]);
    }
  }, [addictions, token, handleDataError]);

  const createAddiction = useCallback(async (payload) => {
    await withLoading(async () => {
      await viciosService.criarVicio(payload, token);
      showToast('success', 'Vicio criado com sucesso!');
      await loadAddictions();
    }, 'Nao foi possivel criar o vicio.');
  }, [token, showToast, loadAddictions, withLoading]);

  const deleteAddiction = useCallback((addiction) => {
    showConfirm(
      'Confirmar Exclusao',
      `Tem certeza que deseja excluir "${addiction.nome_vicio}"? Esta acao nao pode ser desfeita.`,
      () => withLoading(async () => {
        await viciosService.excluirVicio(addiction.id, token);
        showToast('success', 'Vicio excluido com sucesso!');
        await loadAddictions();
        if (selectedAddiction?.id === addiction.id) setSelectedAddiction(null);
      }, 'Nao foi possivel excluir o vicio.')
    );
  }, [token, showToast, showConfirm, loadAddictions, selectedAddiction, withLoading]);

  const registerRelapse = useCallback(async (addiction, { resetCounter = false } = {}) => {
    await withLoading(async () => {
      await viciosService.registrarRecaida(addiction.id, '', resetCounter, token);
      showToast('success', resetCounter
        ? 'Contador resetado! Um novo capitulo comeca.'
        : 'Recaida registrada! Vamos refletir sobre o ocorrido.');
      await loadAddictions();
      await loadRelapses();
      if (selectedAddiction?.id === addiction.id) {
        await loadAddictionDetails(addiction.id);
      }
    }, 'Nao foi possivel registrar a recaida.');
  }, [token, showToast, loadAddictions, loadRelapses, loadAddictionDetails, selectedAddiction, withLoading]);

  const createRecord = useCallback(async (recordForm) => {
    if (!recordForm.humor) {
      showToast('error', 'Selecione um humor antes de salvar');
      return false;
    }
    if (!selectedAddiction?.id) {
      showToast('error', 'Selecione um vicio antes de salvar o registro.');
      return false;
    }
    const result = await withLoading(async () => {
      await registrosService.criarRegistro({ ...recordForm, vicio_id: selectedAddiction.id }, token);
      showToast('success', 'Registro diario criado!');
      await loadAddictionDetails(selectedAddiction.id);
      return true;
    }, 'Nao foi possivel criar o registro diario.');
    return result ?? false;
  }, [token, selectedAddiction, showToast, loadAddictionDetails, withLoading]);

  const createGoal = useCallback(async (goalForm) => {
    await withLoading(async () => {
      await metasService.criarMeta(goalForm, token);
      showToast('success', 'Meta criada com sucesso!');
      await loadGoals();
    }, 'Nao foi possivel criar a meta.');
  }, [token, showToast, loadGoals, withLoading]);

  const completeGoal = useCallback(async (goalId) => {
    await withLoading(async () => {
      await metasService.completarMeta(goalId, token);
      showToast('success', 'Parabens! Meta concluida!');
      await loadGoals();
    }, 'Nao foi possivel concluir a meta.');
  }, [token, showToast, loadGoals, withLoading]);

  const deleteGoal = useCallback((goalId) => {
    showConfirm(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta?',
      () => withLoading(async () => {
        await metasService.excluirMeta(goalId, token);
        showToast('success', 'Meta excluida');
        await loadGoals();
      }, 'Nao foi possivel excluir a meta.')
    );
  }, [token, showToast, showConfirm, loadGoals, withLoading]);

  useEffect(() => {
    if (!user || !token) return;
    loadAddictions();
    loadMotivationalMessage();
    loadGoals();
    loadRelapses();
  }, [user, token, loadAddictions, loadMotivationalMessage, loadGoals, loadRelapses]);

  useEffect(() => {
    if (addictions.length > 0 && token) {
      loadAllRecords();
    } else {
      setAllRecords([]);
    }
  }, [addictions, token, loadAllRecords]);

  return (
    <DataContext.Provider
      value={{
        addictions,
        selectedAddiction,
        setSelectedAddiction,
        selectedAddictionRecords,
        allRecords,
        goals,
        relapses,
        motivationalMessage,
        loadAddictions,
        loadAddictionDetails,
        loadGoals,
        loadRelapses,
        createAddiction,
        deleteAddiction,
        registerRelapse,
        createRecord,
        createGoal,
        completeGoal,
        deleteGoal,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
