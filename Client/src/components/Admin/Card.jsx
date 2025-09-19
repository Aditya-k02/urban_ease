import React from "react";
import styles from "./Card.module.css";

export default function Card({ icon, value, label, borderColor }) {
  return (
    <div
      className={styles.card}
      style={{ borderTopColor: borderColor }}
    >
      <div className={styles.header} style={{ color: borderColor }}>
        {icon}
      </div>
      <div>
        <h3 className={styles.value}>{value}</h3>
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}
