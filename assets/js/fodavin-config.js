/**
 * Fodavin site configuration.
 *
 * Paste the Apps Script Web App URL here after deploying backend/Code.gs.
 * See backend/README.md for the steps.
 *
 * Until this is filled in, forms fall back to a mailto: link so nothing is
 * silently lost, and the admin dashboard shows a setup notice.
 */
window.FODAVIN_CONFIG = {
  // e.g. "https://script.google.com/macros/s/AKfycb.../exec"
  formsEndpoint: 'https://script.google.com/macros/s/AKfycbzOghNzGvB74A5zqOoKYGTEW83CEKocnc4ZAxu9IAVCqDOnvgfaEZE1MH9xTw6jzJuE/exec',

  // Used as the fallback when formsEndpoint is empty.
  fallbackEmail: 'fodavintechnologies@gmail.com'
};
