import styles from '../Styles/App.module.scss';

export default function Info() {
  return (
    <div className={styles.infoContainer}>
      <h1>Welcome to my song scaffolding app!</h1>
      <p>A 3-4 minute long composition has been generated in the Redux store </p>
      <p>All parts are derived off of each other according to a custom algorithm</p>
      <p>The buttons above allow you to edit the details of each part to your liking</p>
      <p>Additional features are being rolled out regularly, stay tuned!</p>
    </div>
  );
};