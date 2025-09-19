import React from 'react';
import styles from './Loader.module.css';

export const Spinner = ({ size = 24, color = '#3b82f6' }) => {
  return (
    <div
      className={styles.spinner}
      style={{
        width: size,
        height: size,
        borderColor: `${color}30`,
        borderTopColor: color,
      }}
    />
  );
};

export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayContent}>
        <Spinner size={48} />
        <p className={styles.overlayMessage}>{message}</p>
      </div>
    </div>
  );
};

export const SkeletonLoader = ({ width = '100%', height = '20px', borderRadius = '4px' }) => {
  return (
    <div
      className={styles.skeleton}
      style={{ width, height, borderRadius }}
    />
  );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className={styles.tableSkeleton}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} height="40px" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Spinner;
