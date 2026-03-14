/**
 * submit.js
 * Submit button — Part 4 will wire this to the backend.
 * For now it renders the styled button in the correct position.
 */

import './styles/submit.css';

export const SubmitButton = () => {
  const handleClick = () => {
    // Part 4: fetch nodes/edges from store and POST to /pipelines/parse
    console.info('[SubmitButton] clicked — backend integration coming in Part 4');
  };

  return (
    <div className="submit-bar">
      <button className="submit-bar__btn" onClick={handleClick}>
        <span className="submit-bar__icon">▶</span>
        Analyse Pipeline
      </button>
    </div>
  );
};