import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import MetasCard from '../components/modals/MetasCard';
import { screenTransition } from '../utils/constants';

export default function MetasPage() {
  const { metas, vicios, handleCriarMeta, handleCompletarMeta, handleExcluirMeta } = useData();
  const { loading } = useUI();

  return (
    <motion.div {...screenTransition}>
      <MetasCard
        metas={metas}
        vicios={vicios}
        onAddMeta={handleCriarMeta}
        onCompleteMeta={handleCompletarMeta}
        onDeleteMeta={handleExcluirMeta}
        loading={loading}
      />
    </motion.div>
  );
}
