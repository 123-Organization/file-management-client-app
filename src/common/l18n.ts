import { Config } from './Config/Config';


interface IDefinitions {
  website_name: string,
  website_url: string 
}

interface IL18n {
  defs: IDefinitions,
  label: {
    [key: string]: string,
  },
}

const definitions: IDefinitions = {
  website_name: 'Sparrow Telehealth',
  website_url: 'telehealth.sparrowhub.com.au',
}

export const l18n: IL18n = {
  defs: definitions,
  label: {
    website_name: definitions.website_name,
    website_version: Config.version,
    website_url: definitions.website_url,
    website_url_full: `https://${definitions.website_url}`,
  },
}
