-- The trigger only sets NEW.data_atualizacao = NOW(); no schema lookup needed.
alter function public.atualizar_data_modificacao() set search_path = '';
