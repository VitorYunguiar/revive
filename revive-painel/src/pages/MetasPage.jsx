import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import MetasCard from '../components/modals/MetasCard';
import { screenTransition } from '../utils/constants';

export default function MetasPage() {
  const { goals, addictions, createGoal, completeGoal, deleteGoal } = useData();
  const { loading } = useUI();

  return (
    <motion.div {...screenTransition}>
      <MetasCard
        metas={goals}
        vicios={addictions}
        onAddMeta={createGoal}
        onCompleteMeta={completeGoal}
        onDeleteMeta={deleteGoal}
        loading={loading}
      />
    </motion.div>
  );
}
