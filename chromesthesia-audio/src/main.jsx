/**
 * Main entry point for the React app
 *
 * This file:
 * 1. Imports React and ReactDOM
 * 2. Renders the App component into the DOM
 * 3. Uses React 18's createRoot API
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Get the root element from the HTML
const rootElement = document.getElementById('root')

// Create a React root and render the app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
