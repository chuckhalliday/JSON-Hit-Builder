import styles from "../Styles/App.module.scss"

interface GenerateProps {
  onClose: () => void;
}

export default function Generate({ onClose }: GenerateProps){
  return (
    <div className={styles.generateContainer}>
      <button onClick={onClose}>x</button>
      <div>
        <h2>Generate New Song</h2>
        <p>~Coming Soon~</p>
      </div>
    </div>
  );
};