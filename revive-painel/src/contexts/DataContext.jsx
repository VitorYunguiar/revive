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

  const loadAddictions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await viciosService.listarVicios(token);
      const processed = (data.vicios || []).map(addiction => ({
        ...addiction,
        dias_abstinencia: Math.max(0, addiction.dias_abstinencia || 0),
        valor_economizado: Math.max(0, addiction.valor_economizado || 0),
        tempo_formatado: addiction.tempo_formatado || calcularTempoDecorrido(addiction.data_inicio)
      }));
      setAddictions(processed);
    } catch (error) {
      handleDataError(error, 'Nao foi possivel carregar seus vicios.');
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, handleDataError]);

  const loadAddictionDetails = useCallback(async (id) => {
    try {
      setLoading(true);
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
    } catch (error) {
      handleDataError(error, 'Nao foi possivel carregar os detalhes do vicio.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, handleDataError]);

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
      const mergedRecords = responses.flatMap(response => response.registros || []);
      setAllRecords(mergedRecords);
    } catch (error) {
      handleDataError(error, 'Nao foi possivel carregar o historico de registros.');
      setAllRecords([]);
    }
  }, [addictions, token, handleDataError]);

  const createAddiction = useCallback(async (payload) => {
    setLoading(true);
    try {
      await viciosService.criarVicio(payload, token);
      showToast('success', 'Vicio criado com sucesso!');
      await loadAddictions();
    } catch (error) {
      handleDataError(error, 'Nao foi possivel criar o vicio.');
    } finally {
      setLoading(false);
    }
  }, [token, showToast, loadAddictions, setLoading, handleDataError]);

  const deleteAddiction = useCallback((addiction) => {
    showConfirm(
      'Confirmar Exclusao',
      `Tem certeza que deseja excluir "${addiction.nome_vicio}"? Esta acao nao pode ser desfeita.`,
      async () => {
        setLoading(true);
        try {
          await viciosService.excluirVicio(addiction.id, token);
          showToast('success', 'Vicio excluido com sucesso!');
          await loadAddictions();
          if (selectedAddiction?.id === addiction.id) {
            setSelectedAddiction(null);
          }
        } catch (error) {
          handleDataError(error, 'Nao foi possivel excluir o vicio.');
        } finally {
          setLoading(false);
        }
      }
    );
  }, [token, showToast, showConfirm, loadAddictions, selectedAddiction, setLoading, handleDataError]);

  const registerRelapseReflect = useCallback(async (addiction) => {
    setLoading(true);
    try {
      await viciosService.registrarRecaida(addiction.id, '', false, token);
      showToast('success', 'Recaida registrada! Vamos refletir sobre o ocorrido.');
      await loadAddictions();
      await loadRelapses();
      if (selectedAddiction?.id === addiction.id) {
        await loadAddictionDetails(addiction.id);
      }
    } catch (error) {
      handleDataError(error, 'Nao foi possivel registrar a recaida.');
    } finally {
      setLoading(false);
    }
  }, [token, showToast, loadAddictions, loadRelapses, loadAddictionDetails, selectedAddiction, setLoading, handleDataError]);

  const registerRelapseReset = useCallback(async (addiction) => {
    setLoading(true);
    try {
      await viciosService.registrarRecaida(addiction.id, '', true, token);
      showToast('success', 'Contador resetado! Um novo capitulo comeca.');
      await loadAddictions();
      await loadRelapses();
      if (selectedAddiction?.id === addiction.id) {
        await loadAddictionDetails(addiction.id);
      }
    } catch (error) {
      handleDataError(error, 'Nao foi possivel registrar a recaida.');
    } finally {
      setLoading(false);
    }
  }, [token, showToast, loadAddictions, loadRelapses, loadAddictionDetails, selectedAddiction, setLoading, handleDataError]);

  const createRecord = useCallback(async (recordForm) => {
    if (!recordForm.humor) {
      showToast('error', 'Selecione um humor antes de salvar');
      return false;
    }
    if (!selectedAddiction?.id) {
      showToast('error', 'Selecione um vicio antes de salvar o registro.');
      return false;
    }

    setLoading(true);
    try {
      await registrosService.criarRegistro({ ...recordForm, vicio_id: selectedAddiction.id }, token);
      showToast('success', 'Registro diario criado!');
      await loadAddictionDetails(selectedAddiction.id);
      return true;
    } catch (error) {
      handleDataError(error, 'Nao foi possivel criar o registro diario.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, selectedAddiction, showToast, loadAddictionDetails, setLoading, handleDataError]);

  const createGoal = useCallback(async (goalForm) => {
    setLoading(true);
    try {
      await metasService.criarMeta(goalForm, token);
      showToast('success', 'Meta criada com sucesso!');
      await loadGoals();
    } catch (error) {
      handleDataError(error, 'Nao foi possivel criar a meta.');
    } finally {
      setLoading(false);
    }
  }, [token, showToast, loadGoals, setLoading, handleDataError]);

  const completeGoal = useCallback(async (goalId) => {
    setLoading(true);
    try {
      await metasService.completarMeta(goalId, token);
      showToast('success', 'Parabens! Meta concluida!');
      await loadGoals();
    } catch (error) {
      handleDataError(error, 'Nao foi possivel concluir a meta.');
    } finally {
      setLoading(false);
    }
  }, [token, showToast, loadGoals, setLoading, handleDataError]);

  const deleteGoal = useCallback((goalId) => {
    showConfirm(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta?',
      async () => {
        setLoading(true);
        try {
          await metasService.excluirMeta(goalId, token);
          showToast('success', 'Meta excluida');
          await loadGoals();
        } catch (error) {
          handleDataError(error, 'Nao foi possivel excluir a meta.');
        } finally {
          setLoading(false);
        }
      }
    );
  }, [token, showToast, showConfirm, loadGoals, setLoading, handleDataError]);

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
        // English naming (code convention)
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
        registerRelapseReflect,
        registerRelapseReset,
        createRecord,
        createGoal,
        completeGoal,
        deleteGoal,

        // Backward-compatible Portuguese aliases
        vicios: addictions,
        vicioSelecionado: selectedAddiction,
        setVicioSelecionado: setSelectedAddiction,
        registros: selectedAddictionRecords,
        allRegistros: allRecords,
        metas: goals,
        recaidas: relapses,
        mensagemMotivacional: motivationalMessage,
        carregarVicios: loadAddictions,
        carregarDetalhesVicio: loadAddictionDetails,
        carregarMetas: loadGoals,
        carregarRecaidas: loadRelapses,
        handleCriarVicio: createAddiction,
        handleExcluirVicio: deleteAddiction,
        handleRegistrarRecaidaRefletir: registerRelapseReflect,
        handleRegistrarRecaidaResetar: registerRelapseReset,
        handleCriarRegistro: createRecord,
        handleCriarMeta: createGoal,
        handleCompletarMeta: completeGoal,
        handleExcluirMeta: deleteGoal
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
