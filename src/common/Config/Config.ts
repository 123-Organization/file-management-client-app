import { Helpers } from "../../helpers/helpers";
const helpers = new Helpers();


let Config: any = {};

/**
 * Version
 */
const version: string = '0.2.0';
Config.version = version;

/**
 * Terms & Conditions
 */
Config.terms = {};
Config.terms.version = 0.1;



/**
 * Backend API
 */
Config.api = {};
Config.api.backend = {};
Config.api.backend.auth = {};
Config.api.backend.patients = {};




export { Config };
