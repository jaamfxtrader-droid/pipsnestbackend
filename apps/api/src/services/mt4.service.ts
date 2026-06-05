type AccountInput = {
  userId: string;
  challengeId: string;
  login?: string;
  server?: string;
  accountSize?: number;
};

export const mt4Service = {
  async createDemoAccount(input: AccountInput) {
    // Future integration point:
    // Add the MT4 Manager API bridge/SDK here and keep credentials in
    // MT4_SERVER, MT4_MANAGER_LOGIN, and MT4_MANAGER_PASSWORD only.
    const login = input.login ?? `84${Date.now().toString().slice(-6)}`;
    return {
      platform: "MT4" as const,
      login,
      password: "demo-master",
      investorPassword: "demo-investor",
      server: input.server ?? process.env.MT4_SERVER ?? "Pipnest-MT4-Demo",
      balance: input.accountSize ?? 25000,
      equity: (input.accountSize ?? 25000) + 740
    };
  },

  async assignTradingAccount(input: AccountInput) {
    return this.createDemoAccount(input);
  },

  async getAccountStats(login: string, accountSize = 25000) {
    const seed = login.length * 137;
    const profit = 400 + (seed % 1200);
    return {
      balance: accountSize,
      equity: accountSize + profit,
      profit,
      dailyDrawdown: 1.4,
      maxDrawdown: 3.7,
      profitTargetProgress: Math.min(100, Number(((profit / (accountSize * 0.08)) * 100).toFixed(2))),
      openTrades: 2,
      closedTrades: 18
    };
  },

  async getOpenTrades(login: string) {
    return [{ ticket: `${login}-O1`, symbol: "USDJPY", type: "BUY", lots: 0.3, profit: 42.8 }];
  },

  async getClosedTrades(login: string) {
    return [{ ticket: `${login}-C1`, symbol: "EURJPY", type: "SELL", lots: 0.2, profit: 76.4 }];
  },

  async checkDailyDrawdown(login: string, limitPercent = 5) {
    const stats = await this.getAccountStats(login);
    return { passed: stats.dailyDrawdown <= limitPercent, current: stats.dailyDrawdown, limit: limitPercent };
  },

  async checkMaxDrawdown(login: string, limitPercent = 10) {
    const stats = await this.getAccountStats(login);
    return { passed: stats.maxDrawdown <= limitPercent, current: stats.maxDrawdown, limit: limitPercent };
  },

  async checkProfitTarget(login: string, targetPercent = 8, accountSize = 25000) {
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
