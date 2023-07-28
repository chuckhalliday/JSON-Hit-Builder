import React from 'react';
import styles from './App.module.scss';

export default function Info() {
  return (
    <div className={styles.infoContainer}>
      {/* Add the information you want to display */}
      <h1>Welcome to my song scaffolding app!</h1>
      <p>A 3-4 minute composition has been randomly generated in the Redux store </p>
      <p>All parts are derived off of each other by a custom (evolving) algorithm</p>
      <p>The buttons above allow you to edit the details to your liking</p>
      <p>Additional features and bug fixes are being rolled out regularly, stay tuned!</p>
    </div>
  );
};