/**
 * App.js
 * Root component — composes Toolbar | Canvas | SubmitButton
 * into a full-height side-by-side layout.
 */

import { PipelineToolbar } from './toolbar';
import { PipelineUI }      from './ui';
import { SubmitButton }    from './submit';
import './styles/app.css';

function App() {
  return (
    <div className="app">
      {/* Left sidebar — node palette */}
      <PipelineToolbar />

      {/* Main area — canvas + submit */}
      <div className="app__main">
        <PipelineUI />
        <SubmitButton />
      </div>
    </div>
  );
}

export default App;