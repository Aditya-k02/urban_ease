import React from "react";
import styles from "./Header.module.css";

export default function Header({ title = "Communities" }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
}
