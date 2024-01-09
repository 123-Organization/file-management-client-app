const prod = {
  ENVIRONMENT : "PROD",
  SERVER_BASE_URL : "https://prod1-api.finerworks.com/api/",
  COMPANION_BASE_URL : "https://prod-companion-app-filemanagement.finerworks.com",
}

const dev = {
  ENVIRONMENT : "STAGE",
  SERVER_BASE_URL : "https://app-filemanager.finerworks.com/api/",
  COMPANION_BASE_URL : "https://companion-app-filemanagement.finerworks.com",
}

const prodDomain = ['prod1-filemanger-app.finerworks.com']
const isProd = prodDomain.includes(document.domain);

const config = isProd ? prod : dev;

export default {
  // Add common config values here
  MAX_CHARACTER_FILENAME: 30,
  MAX_ATTACHMENT_SIZE: 5000000,
  ...config
};