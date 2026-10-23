import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.content}>
        <small>© Biserica Betel Bilbao</small>
      </div>
    </footer>
  );
}
