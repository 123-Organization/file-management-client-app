const prod = {
  SERVER_BASE_URL : "https://app-filemanager.finerworks.com/api/",
  COMPANION_BASE_URL : "https://companion-app-filemanagement.finerworks.com",
}

const dev = {
  SERVER_BASE_URL : "https://app-filemanager.finerworks.com/api/",
  COMPANION_BASE_URL : "https://companion-app-filemanagement.finerworks.com",
}

const prodDomain = ['prod1-filemanger-app.finerworks.com']
const isProd = prodDomain.includes(window.location.host) || prodDomain.includes(window.parent.location.host) ;

const config = isProd ? prod : dev;

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 5000000,
  ...config
};