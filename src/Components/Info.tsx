import styles from '../Styles/App.module.scss';
import FitBox from './FitBox';

// The landing text, sized to the space between the keyboard and the
// transport: on phones it grows or shrinks to fill it, centered; on wider
// screens it only ever shrinks, from the top.
export default function Info({ phone }: { phone: boolean }) {
  return (
    <FitBox className={styles.fillSection} max={phone ? 1.4 : 1} min={0.4} align={phone ? 'center' : 'top'}>
      <div className={styles.infoContainer}>
        <h1>Sculpt a song framework, then finish it in your DAW</h1>
        <p>A full song has been roughed out from a form template: sections, chords, bass, drums, and voicings</p>
        <p>The blocks above are the arrangement: click one to open its section, drag to reorder</p>
        <p>Each section is defined once; edit it and every repeat follows. Lock a layer to keep it, re-roll the rest</p>
        <p>Click the key in the lower left to start over with a different form, key, mode, or tempo</p>
        <p>When the bones are right, Export MIDI and keep going in your DAW</p>
      </div>
    </FitBox>
  );
};
