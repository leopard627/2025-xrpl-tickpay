// A2A Wallet Manager - Safe wallet management for agent transactions
import { Client, Wallet } from 'xrpl';

export class A2AWalletManager {
  private static instance: A2AWalletManager;
  private clients: Map<string, Client> = new Map();
  private connectionPromises: Map<string, Promise<Client>> = new Map();

  private constructor() {}

  static getInstance(): A2AWalletManager {
    if (!A2AWalletManager.instance) {
      A2AWalletManager.instance = new A2AWalletManager();
    }
    return A2AWalletManager.instance;
  }

  /**
   * Get a connected XRPL client for an agent
   */
  async getClient(agentId: string): Promise<Client> {
    // Check if we already have a connection promise in progress
    const existingPromise = this.connectionPromises.get(agentId);
    if (existingPromise) {
      return await existingPromise;
    }

    // Check if we already have a connected client
    const existingClient = this.clients.get(agentId);
    if (existingClient && existingClient.isConnected()) {
      return existingClient;
    }

    // Create new connection promise
    const connectionPromise = this.createConnection(agentId);
    this.connectionPromises.set(agentId, connectionPromise);

    try {
      const client = await connectionPromise;
      this.clients.set(agentId, client);
      return client;
    } finally {
      // Clean up the connection promise
      this.connectionPromises.delete(agentId);
    }
  }

  /**
   * Create a new XRPL connection
   */
  private async createConnection(agentId: string): Promise<Client> {
    const client = new Client('wss://s.devnet.rippletest.net:51233');

    console.log(`🔗 Connecting to XRPL Devnet for agent: ${agentId}`);

    // Set up connection timeout
    const connectionTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Connection timeout for agent ${agentId}`)), 15000)
    );

    try {
      await Promise.race([client.connect(), connectionTimeout]);

      if (!client.isConnected()) {
        throw new Error(`Failed to establish XRPL connection for agent ${agentId}`);
      }

      console.log(`✅ XRPL connection established for agent: ${agentId}`);
      return client;

    } catch (error) {
      console.error(`❌ Failed to connect to XRPL for agent ${agentId}:`, error);

      // Clean up failed client
      try {
        await client.disconnect();
      } catch (disconnectError) {
        console.warn(`Warning: Failed to disconnect failed client for ${agentId}:`, disconnectError);
      }

      throw error;
    }
  }

  /**
   * Disconnect a client for an agent
   */
  async disconnectAgent(agentId: string): Promise<void> {
    const client = this.clients.get(agentId);
    if (client && client.isConnected()) {
      try {
        await client.disconnect();
        console.log(`🔌 Disconnected XRPL client for agent: ${agentId}`);
      } catch (error) {
        console.warn(`Warning: Failed to disconnect client for ${agentId}:`, error);
      }
    }
    this.clients.delete(agentId);
    this.connectionPromises.delete(agentId);
  }

  /**
   * Disconnect all clients
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map(agentId =>
      this.disconnectAgent(agentId)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Get wallet balance for an agent
   */
  async getWalletBalance(agentAddress: string): Promise<string> {
    // Use a temporary client for balance check
    const client = new Client('wss://s.devnet.rippletest.net:51233');

    try {
      await client.connect();
      const response = await client.request({
        command: 'account_info',
        account: agentAddress,
        ledger_index: 'validated'
      });

      return (parseInt(response.result.account_data.Balance) / 1000000).toString();
    } catch (error) {
      console.error(`Failed to get balance for ${agentAddress}:`, error);
      return '0';
    } finally {
      if (client.isConnected()) {
        await client.disconnect();
      }
    }
  }

  /**
   * Validate wallet credentials
   */
  validateWalletCredentials(address: string, seed: string): boolean {
    try {
      const wallet = Wallet.fromSeed(seed);
      return wallet.address === address;
    } catch (error) {
      console.error('Invalid wallet credentials:', error);
      return false;
    }
  }

  /**
   * Get connection status for all agents
   */
  getConnectionStatus(): { [agentId: string]: boolean } {
    const status: { [agentId: string]: boolean } = {};
    this.clients.forEach((client, agentId) => {
      status[agentId] = client.isConnected();
    });
    return status;
  }
}

// Export singleton instance
export const walletManager = A2AWalletManager.getInstance();