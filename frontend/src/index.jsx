import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import backgroundSvg from './media/background.svg';

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Apply background to body
document.body.style.backgroundImage = `url(${backgroundSvg})`;
document.body.style.backgroundRepeat = 'no-repeat';
document.body.style.backgroundSize = 'cover';
document.body.style.backgroundPosition = 'center';
document.body.style.backgroundAttachment = 'fixed';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

