export type Environment = 'dev' | 'qa' | 'prod';
export type Role = 'admin' | 'standard';

export interface UserCredentials {
  username: string;
  password: string;
}

type CredentialsStore = Record<Environment, Record<Role, UserCredentials>>;

const credentials: CredentialsStore = {
  dev: {
    admin: {
      username: process.env.DEV_ADMIN_USER || 'dev_admin@yourapp.com',
      password: process.env.DEV_ADMIN_PASS || 'DevAdmin@123',
    },
    standard: {
      username: process.env.DEV_USER || 'Sj@yopmail.com',
      password: process.env.DEV_USER_PASS || 'Test@123Test@123',
    },
  },
  qa: {
    admin: {
      username: process.env.QA_ADMIN_USER || 'qa_admin@yourapp.com',
      password: process.env.QA_ADMIN_PASS || 'QaAdmin@123',
    },
    standard: {
      username: process.env.QA_USER || 'qa_user@yourapp.com',
      password: process.env.QA_USER_PASS || 'QaUser@123',
    },
  },
  prod: {
    admin: {
      username: process.env.PROD_ADMIN_USER || '',
      password: process.env.PROD_ADMIN_PASS || '',
    },
    standard: {
      username: process.env.PROD_USER || '',
      password: process.env.PROD_USER_PASS || '',
    },
  },
};

function getCredentials(env: Environment, role: Role = 'standard'): UserCredentials {
  const envCreds = credentials[env];
  if (!envCreds) throw new Error(`No credentials configured for env: ${env}`);
  const roleCreds = envCreds[role];
  if (!roleCreds) throw new Error(`No credentials for role "${role}" in env "${env}"`);
  return roleCreds;
}

export { getCredentials, credentials };
