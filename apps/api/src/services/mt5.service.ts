type AccountInput = {
  userId: string;
  challengeId: string;
  login?: string;
  server?: string;
  accountSize?: number;
};

function pseudoRandomFrom(login: string) {
  return login.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export const mt5Service = {
  async createDemoAccount(input: AccountInput) {
    // Future integration point:
    // Add the official MT5 Manager API SDK/client here and read manager credentials
    // only from MT5_SERVER, MT5_MANAGER_LOGIN, and MT5_MANAGER_PASSWORD.
    const login = input.login ?? `95${Date.now().toString().slice(-6)}`;
    return {
      platform: "MT5" as const,
      login,
      password: "demo-master",
      investorPassword: "demo-investor",
      server: input.server ?? process.env.MT5_SERVER ?? "Pipnest-MT5-Demo",
      balance: input.accountSize ?? 50000,
      equity: (input.accountSize ?? 50000) + 1250
    };
  },

  async assignTradingAccount(input: AccountInput) {
    return this.createDemoAccount(input);
  },

  async getAccountStats(login: string, accountSize = 50000) {
    const seed = pseudoRandomFrom(login);
    const profit = 850 + (seed % 2400);
    const equity = accountSize + profit;
    return {
      balance: accountSize,
      equity,
      profit,
      dailyDrawdown: Number(((seed % 42) / 10).toFixed(2)),
      maxDrawdown: Number(((seed % 68) / 10).toFixed(2)),
      profitTargetProgress: Math.min(100, Number(((profit / (accountSize * 0.08)) * 100).toFixed(2))),
      openTrades: seed % 5,
      closedTrades: 12 + (seed % 30)
    };
  },

  async getOpenTrades(login: string) {
    return [
      { ticket: `${login}-O1`, symbol: "EURUSD", type: "BUY", lots: 0.5, profit: 124.2 },
      { ticket: `${login}-O2`, symbol: "XAUUSD", type: "SELL", lots: 0.1, profit: -32.5 }
    ];
  },

  async getClosedTrades(login: string) {
    return [
      { ticket: `${login}-C1`, symbol: "GBPUSD", type: "BUY", lots: 0.4, profit: 220.1 },
      { ticket: `${login}-C2`, symbol: "US30", type: "SELL", lots: 0.2, profit: 98.75 }
    ];
  },

  async checkDailyDrawdown(login: string, limitPercent = 5) {
    const stats = await this.getAccountStats(login);
    return { passed: stats.dailyDrawdown <= limitPercent, current: stats.dailyDrawdown, limit: limitPercent };
  },

  async checkMaxDrawdown(login: string, limitPercent = 10) {
    const stats = await this.getAccountStats(login);
    return { passed: stats.maxDrawdown <= limitPercent, current: stats.maxDrawdown, limit: limitPercent };
  },

  async checkProfitTarget(login: string, targetPercent = 8, accountSize = 50000) {
    const stats = await this.getAccountStats(login, accountSize);
    const target = accountSize * (targetPercent / 100);
    return { passed: stats.profit >= target, current: stats.profit, target };
  },

  async syncTradingAccount(login: string, accountSize?: number) {
    const stats = await this.getAccountStats(login, accountSize);
    const openTrades = await this.getOpenTrades(login);
    const closedTrades = await this.getClosedTrades(login);
    return { stats, openTrades, closedTrades, syncedAt: new Date().toISOString() };
  }
};
