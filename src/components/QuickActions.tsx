import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, ArrowUpFromLine, Send, TrendingUp } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  bgColor: string;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions: QuickAction[] = [
    {
      id: 'add',
      label: t('dashboard.add'),
      icon: <ArrowDownToLine size={24} />,
      onClick: () => navigate('/wallet'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    },
    {
      id: 'withdraw',
      label: t('dashboard.withdraw'),
      icon: <ArrowUpFromLine size={24} />,
      onClick: () => navigate('/wallet'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    },
    {
      id: 'send',
      label: t('dashboard.send'),
      icon: <Send size={24} />,
      onClick: () => navigate('/wallet'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50',
    },
    {
      id: 'grow',
      label: t('dashboard.growth'),
      icon: <TrendingUp size={24} />,
      onClick: () => navigate('/grow'),
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-200 dark:hover:bg-pink-900/50',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
  };

  return (
    <div className="w-full flex justify-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-center gap-6 sm:gap-8"
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            variants={itemVariants}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 group"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {/* Icon Circle */}
            <motion.div
              className={`
                w-14 h-14 sm:w-16 sm:h-16 rounded-full
                flex items-center justify-center
                transition-all duration-300 ease-out
                ${action.bgColor}
                ${action.color}
                border-2 border-transparent group-hover:border-current/50
              `}
              whileHover={{ rotate: 5 }}
            >
              <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {action.icon}
              </motion.div>
            </motion.div>

            {/* Label */}
            <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 text-center group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
