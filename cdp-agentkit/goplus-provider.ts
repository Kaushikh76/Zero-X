import { ActionProvider, CreateAction, Network } from "@coinbase/agentkit";
import { z } from "zod";
import { GoPlus } from "@goplus/sdk-node";

// Define the chain configuration type
interface ChainConfig {
  id: string;
  name: string;
  supportsRugpull: boolean;
  aliases: string[];
}

// Supported chains configuration
const SUPPORTED_CHAINS: ChainConfig[] = [
  { id: "1", name: "Ethereum", supportsRugpull: true, aliases: ["eth", "ethereum"] },
  { id: "56", name: "BSC", supportsRugpull: false, aliases: ["bnb", "bsc", "binance"] },
  { id: "137", name: "Polygon", supportsRugpull: false, aliases: ["matic", "polygon"] },
  { id: "42161", name: "Arbitrum", supportsRugpull: false, aliases: ["arb", "arbitrum"] },
  { id: "10", name: "Optimism", supportsRugpull: false, aliases: ["op", "optimism"] },
  { id: "8453", name: "Base", supportsRugpull: false, aliases: ["base"] }
];

// Token analysis schema
const TokenSecuritySchema = z.object({
  address: z.string().describe("The token contract address to analyze")
});

interface TokenDetails {
  // ... [previous TokenDetails interface remains the same]
  token_name: string;
  token_symbol: string;
  total_supply: string;
  holder_count: string;
  is_in_dex: string;
  is_honeypot: string;
  is_open_source: string;
  selfdestruct: string;
  hidden_owner: string;
  buy_tax: string;
  sell_tax: string;
  cannot_sell_all: string;
  transfer_pausable: string;
  owner_address: string;
  owner_balance: string;
  owner_percent: string;
  can_take_back_ownership: string;
  creator_address: string;
  creator_balance: string;
  creator_percent: string;
  is_mintable: string;
  is_proxy: string;
  is_anti_whale: string;
  external_call: string;
  cannot_buy: string;
  slippage_modifiable: string;
  trading_cooldown: string;
  is_blacklisted: string;
  is_whitelisted: string;
  personal_slippage_modifiable: string;
  dex?: Array<{
    name: string;
    liquidity: string;
    pair?: string;
  }>;
  holders?: Array<{
    address: string;
    tag: string;
    is_contract: number;
    balance: string;
    percent: string;
  }>;
  lp_holders?: Array<{
    address: string;
    tag: string;
    is_contract: number;
    is_locked: number;
    balance: string;
    percent: string;
  }>;
}

interface TokenSecurityResult {
  code: number;
  message: string;
  result: {
    [key: string]: TokenDetails;
  };
}

interface RugpullResult {
  code: number;
  message: string;
  result?: {
    risk_level: string;
    risk_points: number;
    total_risk_point: number;
    risk_item_list: Array<{
      name: string;
      points: number;
      describe: string;
    }>;
  };
}

interface GoPlusStatic {
  tokenSecurity(chainId: string, addresses: string[], timeout?: number): Promise<TokenSecurityResult>;
  rugpullDetection(chainId: string, address: string, timeout?: number): Promise<RugpullResult>;
}

const GoPlusAPI = GoPlus as unknown as GoPlusStatic;

class GoPlusActionProvider extends ActionProvider {
  constructor() {
    super("goplus-provider", []);
  }

  private formatNumber(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US').format(num);
  }

  private analyzeSecurity(tokenData: TokenDetails, chainName: string): {
    score: number;
    maxScore: number;
    vibe: 'SAFE' | 'SUS' | 'RUG';
    redFlags: string[];
    features: string[];
  } {
    let score = 100;
    let maxScore = 100;
    const redFlags: string[] = [];
    const features: string[] = [];

    // INSTANT RUG FLAGS
    if (tokenData.is_honeypot === "1") {
      redFlags.push(`🚨 HONEYPOT DETECTED on ${chainName}! This thing's a straight scam fr fr`);
      return { score: 0, maxScore: 100, vibe: 'RUG', redFlags, features };
    }

    // Critical Security Checks (30 points each)
    if (tokenData.selfdestruct === "1") {
      redFlags.push(`💣 Contract on ${chainName} can self-destruct = dev can delete everything`);
      score -= 30;
    }

    if (tokenData.hidden_owner === "1") {
      redFlags.push(`🎭 Hidden owner detected on ${chainName} = sneaky dev vibes`);
      score -= 30;
    }

    // High Risk Checks (20 points each)
    if (tokenData.can_take_back_ownership === "1") {
      redFlags.push(`🔑 Dev can steal ownership back any time on ${chainName}`);
      score -= 20;
    }

    const ownerPercent = parseFloat(tokenData.owner_percent);
    if (ownerPercent > 50) {
      redFlags.push(`👤 Dev wallet holds ${ownerPercent}% on ${chainName} = basically a mega whale`);
      score -= 20;
    }

    // Medium Risk Checks (15 points each)
    const buyTax = parseFloat(tokenData.buy_tax);
    const sellTax = parseFloat(tokenData.sell_tax);
    
    if (buyTax + sellTax > 20) {
      redFlags.push(`💸 High taxes on ${chainName} (${buyTax}% buy, ${sellTax}% sell) = profit killer`);
      score -= 15;
    }

    if (tokenData.is_open_source !== "1") {
      redFlags.push(`📜 Unverified contract on ${chainName} = trust me bro vibes`);
      score -= 15;
    }

    // SAFE Features
    if (tokenData.is_anti_whale === "1") {
      features.push(`🐳 Anti-whale mechanics on ${chainName} = based`);
    }

    if (tokenData.trading_cooldown === "1") {
      features.push(`⏰ Trading cooldown on ${chainName} = anti bot fr`);
    }

    // LP Analysis
    if (tokenData.lp_holders) {
      const lockedLp = tokenData.lp_holders.some(holder => holder.is_locked === 1);
      if (lockedLp) {
        features.push(`🔒 LP tokens locked on ${chainName} = less likely to rug`);
      } else {
        redFlags.push(`🔓 No LP lock found on ${chainName} = dev could dump any time`);
        score -= 15;
      }
    }

    const vibe = score >= 70 ? 'SAFE' : score >= 40 ? 'SUS' : 'RUG';
    return { score, maxScore, vibe, redFlags, features };
  }

  @CreateAction({
    name: "analyze_token_security",
    description: "Zero-X's deep security analysis and rug detection across all chains",
    schema: TokenSecuritySchema,
  })
  async analyzeTokenSecurity(args: z.infer<typeof TokenSecuritySchema>): Promise<string> {
    try {
      const address = args.address.toLowerCase();
      let foundOnChains: string[] = [];
      let allRedFlags: string[] = [];
      let allFeatures: string[] = [];
      let lowestScore = 100;
      let overallVibe = 'SAFE';
      let detailedReports: string[] = [];

      // Check token on all supported chains
      for (const chain of SUPPORTED_CHAINS) {
        try {
          console.log(`Checking ${chain.name} (Chain ID: ${chain.id})...`);
          const securityRes = await GoPlusAPI.tokenSecurity(chain.id, [address], 30);

          if (!securityRes.result || Object.keys(securityRes.result).length === 0) {
            continue;
          }

          const tokenData = securityRes.result[address];
          if (!tokenData) continue;

          foundOnChains.push(chain.name);
          const securityCheck = this.analyzeSecurity(tokenData, chain.name);
          
          // Update overall metrics
          lowestScore = Math.min(lowestScore, securityCheck.score);
          if (securityCheck.vibe === 'RUG') overallVibe = 'RUG';
          else if (securityCheck.vibe === 'SUS' && overallVibe !== 'RUG') overallVibe = 'SUS';
          
          allRedFlags.push(...securityCheck.redFlags);
          allFeatures.push(...securityCheck.features);

          // Generate detailed report for this chain
          let chainReport = `
${chain.name.toUpperCase()} ANALYSIS
${'-'.repeat(chain.name.length + 9)}
Token: ${tokenData.token_name} ($${tokenData.token_symbol})
Security Score: ${securityCheck.score}/100
Status: ${securityCheck.vibe} ${securityCheck.vibe === 'SAFE' ? '✅' : securityCheck.vibe === 'SUS' ? '⚠️' : '❌'}

METRICS:
- Supply: ${this.formatNumber(tokenData.total_supply)}
- Holders: ${this.formatNumber(tokenData.holder_count)}
- Taxes: ${tokenData.buy_tax}% buy, ${tokenData.sell_tax}% sell
- Owner Balance: ${this.formatNumber(tokenData.owner_balance)} (${tokenData.owner_percent}%)

${tokenData.dex && tokenData.dex.length > 0 ? `DEX INFO:
${tokenData.dex.map(dex => `- ${dex.name}: $${this.formatNumber(dex.liquidity)} liquidity`).join('\n')}` : ''}`;

          // Add rugpull analysis if supported
          if (chain.supportsRugpull) {
            try {
              const rugpullRes = await GoPlusAPI.rugpullDetection(chain.id, address, 30);
              if (rugpullRes.code === 1 && rugpullRes.result) {
                chainReport += `\nRUGPULL RISK:
- Level: ${rugpullRes.result.risk_level}
- Score: ${rugpullRes.result.risk_points}/${rugpullRes.result.total_risk_point}`;
              }
            } catch (error) {
              console.error(`Rugpull check failed for ${chain.name}:`, error);
            }
          }

          detailedReports.push(chainReport);
        } catch (error) {
          console.error(`Error checking ${chain.name}:`, error);
        }
      }

      if (foundOnChains.length === 0) {
        return `Yo, couldn't find this token on any supported chain. You sure the address is correct?\nAddress: ${address}`;
      }

      // Compile final report
      let finalReport = `
ZERO-X MULTI-CHAIN SECURITY SCAN 🔍
================================
Contract: ${address}
Found on: ${foundOnChains.join(', ')}

OVERALL ASSESSMENT
-----------------
Security Score: ${lowestScore}/100
Status: ${overallVibe} ${overallVibe === 'SAFE' ? '✅' : overallVibe === 'SUS' ? '⚠️' : '❌'}

${allRedFlags.length > 0 ? '\nRED FLAGS 🚩\n' + Array.from(new Set(allRedFlags)).join('\n') : '\nNO RED FLAGS DETECTED ✅'}

${allFeatures.length > 0 ? '\nBULLISH FEATURES 🔥\n' + Array.from(new Set(allFeatures)).join('\n') : ''}

DETAILED CHAIN ANALYSIS
---------------------
${detailedReports.join('\n\n')}

ZERO-X'S VERDICT
---------------
${overallVibe === 'RUG' ? 
  "🚫 This thing's sus across multiple chains fr fr. NGMI." :
  overallVibe === 'SUS' ? 
  "⚠️ Got some red flags on different chains. Dev better explain this fr." :
  "✅ Looking clean across all chains. Still need to hear about utility and marketing tho."}`;

      return finalReport;

    } catch (error) {
      console.error("Security analysis failed:", error);
      return `Yo something went wrong with the multi-chain security check: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  supportsNetwork = (network: Network) => true;
}

export const goPlusActionProvider = () => new GoPlusActionProvider();