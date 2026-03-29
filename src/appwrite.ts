import { Client, Account, Databases, ID } from 'appwrite';

/**
 * Appwrite Client Initialization
 * Connects to the specified Appwrite endpoint and project.
 */
const client = new Client();

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69c2b4a10015a5c19a9f');

/**
 * Appwrite Services
 * Exported for use across the application to interact with Auth, Databases, etc.
 */
export const account = new Account(client);
export const databases = new Databases(client);

/**
 * Utility for generating unique IDs for documents and users.
 */
export { ID };

/**
 * Database and Collection Constants
 * These IDs must match the ones created in your Appwrite Console.
 * 
 * Note: Even if only using Auth initially, these are exported to establish
 * a scalable pattern for future data storage needs.
 */
export const DATABASE_ID = 'main';
export const COLLECTION_USERS = 'users';
export const COLLECTION_PRODUCTS = 'products';

// Export the client itself in case direct access is needed
export { client };