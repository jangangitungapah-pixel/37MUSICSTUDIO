import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => (
  <motion.div
    style={{ flex: 1, minHeight: 0 }}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
