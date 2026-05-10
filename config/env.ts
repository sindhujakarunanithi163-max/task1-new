export interface EnvConfig {
  baseURL: string;
  apiURL: string;
  headless: boolean;
  timeout: number;
  dbName: string;
  logLevel: string;
}

export type EnvironmentName = 'dev' | 'qa' | 'prod';

const environments: Record<EnvironmentName, EnvConfig> = {
  dev: {
    baseURL: 'https://ns1-dev.nettshield.com:8443',
    apiURL: 'https://dev-api.yourapp.com',
    headless: false,
    timeout: 30000,
    dbName: 'dev_db',
    logLevel: 'debug',
  },
  qa: {
    baseURL: 'https://qa.yourapp.com',
    apiURL: 'https://qa-api.yourapp.com',
    headless: true,
    timeout: 45000,
    dbName: 'qa_db',
    logLevel: 'info',
  },
  prod: {
    baseURL: 'https://www.yourapp.com',
    apiURL: 'https://api.yourapp.com',
    headless: true,
    timeout: 60000,
    dbName: 'prod_db',
    logLevel: 'warn',
  },
};

function getEnvConfig(): EnvConfig {
  const env = (process.env.ENV || 'dev').toLowerCase() as EnvironmentName;
  if (!environments[env]) {
    console.warn(`Unknown ENV "${env}", falling back to "qa"`);
    return environments.qa;
  }
  return environments[env];
}

function getActiveEnv(): EnvironmentName {
  return (process.env.ENV || 'dev').toLowerCase() as EnvironmentName;
}

export { getEnvConfig, getActiveEnv, environments };
