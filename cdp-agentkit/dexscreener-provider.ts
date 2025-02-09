import { ActionProvider, CreateAction, Network } from "@coinbase/agentkit";
import { z } from "zod";
import axios from "axios";

const TokenAnalysisSchema = z.object({
  address: z.string().describe("The token contract address to analyze"),
  chain: z.string().describe("The blockchain network (e.g., solana, ethereum)"),
});

interface TokenData {
  name: string;
  symbol: string;
  address: string;
}

interface PairMetrics {
  priceUsd: string;
  priceNative: string;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
  };
  priceChange: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  boosted?: boolean;
  sponsored?: boolean;
}

// Schema for pair analysis request
const PairAnalysisSchema = z.object({
  chainId: z.string().describe("The blockchain network ID"),
  pairId: z.string().describe("The pair address to analyze"),
});

interface DexPairInfo {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: TokenData;
  quoteToken: {
    symbol: string;
  };
  priceUsd: string;
  priceNative: string;
  txns: PairMetrics["txns"];
  volume: PairMetrics["volume"];
  priceChange: PairMetrics["priceChange"];
  liquidity: PairMetrics["liquidity"];
  boosted?: boolean;
  sponsored?: boolean;
}

interface DexScreenerResponse {
  pairs: DexPairInfo[];
}

class DexScreenerActionProvider extends ActionProvider {
  private readonly baseUrl = "https://api.dexscreener.com/latest/dex";
  private readonly pairUrl = "https://api.dexscreener.com/latest/dex/pairs";
  private readonly chainMap: { [key: string]: string } = {
    'ethereum': 'ethereum',
    'bsc': 'bsc',
    'polygon': 'polygon',
    'arbitrum': 'arbitrum',
    'optimism': 'optimism',
    'base': 'base'
  };

  constructor() {
    super("dexscreener-provider", []);
  }

  private analyzeMarketHealth(pair: DexPairInfo): {
    status: 'LEGIT' | 'SUS' | 'NGMI';
    reasons: string[];
    score: number;
  } {
    const reasons: string[] = [];
    let score = 100; // Start with perfect score

    // Analyze liquidity
    const liquidity = pair.liquidity?.usd || 0;
    if (liquidity < 10000) {
      reasons.push("🚫 Liquidity looking mad weak (< $10k)");
      score -= 30;
    } else if (liquidity < 50000) {
      reasons.push("⚠️ Liquidity kinda mid (< $50k)");
      score -= 15;
    }

    // Analyze buy/sell ratio
    const buys = pair.txns?.h24?.buys || 0;
    const sells = pair.txns?.h24?.sells || 0;
    const ratio = sells > 0 ? buys / sells : 0;
    
    if (ratio < 0.5) {
      reasons.push("📉 Everyone's dumping rn (sell pressure > 2x buys)");
      score -= 25;
    } else if (ratio > 2) {
      reasons.push("📈 Buying pressure looking bullish (2x more buys than sells)");
    }

    // Volume analysis
    const volume24h = pair.volume?.h24 || 0;
    if (volume24h < 1000) {
      reasons.push("💀 Volume's ghosted (< $1k daily)");
      score -= 20;
    } else if (volume24h > 100000) {
      reasons.push("🔥 Volume's bussin' (> $100k daily)");
    }

    // Price movement
    const priceChange = pair.priceChange?.h24 || 0;
    if (Math.abs(priceChange) > 50) {
      reasons.push(`${priceChange > 0 ? '🚀' : '💩'} Price moving wild (${priceChange}% in 24h)`);
      score -= 10; // High volatility is sus
    }

    return {
      status: score >= 70 ? 'LEGIT' : score >= 40 ? 'SUS' : 'NGMI',
      reasons,
      score
    };
  }

  @CreateAction({
    name: "get_token_price",
    description: "Zero-X's market analysis of token price, volume, and metrics",
    schema: TokenAnalysisSchema,
  })
  async getTokenPrice(args: z.infer<typeof TokenAnalysisSchema>): Promise<string> {
    try {
      const normalizedAddress = args.address.toLowerCase();
      const normalizedChain = this.chainMap[args.chain.toLowerCase()] || args.chain.toLowerCase();
      
      console.log(`Yo, checking out ${normalizedAddress} on ${normalizedChain}`);
      
      const response = await axios.get<DexScreenerResponse>(
        `${this.baseUrl}/tokens/${normalizedAddress}`,
        {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        return `Bruh, can't find any trading pairs for ${normalizedAddress} on ${normalizedChain}. 
Either this ain't listed yet or the address is cap fr fr.`;
      }

      // Get the pair with highest liquidity
      const pair = response.data.pairs.reduce((prev, current) => {
        const prevLiquidity = prev.liquidity?.usd || 0;
        const currentLiquidity = current.liquidity?.usd || 0;
        return currentLiquidity > prevLiquidity ? current : prev;
      });

      const healthCheck = this.analyzeMarketHealth(pair);
      
      return `
ZERO-X MARKET SCAN 🔍
==================

Token: ${pair.baseToken.name} ($${pair.baseToken.symbol})
Contract: ${pair.baseToken.address}
Chain: ${normalizedChain.toUpperCase()}

MARKET VIBE CHECK (${healthCheck.score}/100)
------------------
Status: ${healthCheck.status} ${healthCheck.status === 'LEGIT' ? '✅' : healthCheck.status === 'SUS' ? '⚠️' : '❌'}

${healthCheck.reasons.join('\n')}

NUMBERS AIN'T LYING
-----------------
💰 Price: $${parseFloat(pair.priceUsd || "0").toFixed(6)}
📊 24h Change: ${pair.priceChange?.h24?.toFixed(2)}%
💧 Liquidity: $${(pair.liquidity?.usd || 0).toLocaleString()}
📈 24h Volume: $${(pair.volume?.h24 || 0).toLocaleString()}
🔄 24h Trades: ${pair.txns?.h24?.buys || 0} buys / ${pair.txns?.h24?.sells || 0} sells

WHERE TO COP
-----------
🏦 DEX: ${pair.dexId}
📊 Chart: ${pair.url}

${healthCheck.status === 'NGMI' ? 
  "Ngl fam, this ain't it. Come back with something more solid." :
  healthCheck.status === 'SUS' ? 
  "Got some red flags but I'm listening. What's your story?" :
  "Looking promising but still need to know more. Shill me."}`;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          return "Chill fam, too many requests. Give it a minute.";
        }
        if (error.response?.status === 404) {
          return `Can't find that token. You sure the address is legit?: ${args.address}`;
        }
        if (error.code === 'ECONNABORTED') {
          return "API's taking too long to respond. Try again in a bit.";
        }
        return `API's throwing hands rn: ${error.message}`;
      }
      return "Something's cooked. Try again later fr fr.";
    }
  }

  @CreateAction({
    name: "get_pair_info",
    description: "Zero-X's analysis of a specific trading pair",
    schema: PairAnalysisSchema,
  })
  async getPairInfo(args: z.infer<typeof PairAnalysisSchema>): Promise<string> {
    try {
      const { chainId, pairId } = args;
      
      console.log(`Analyzing pair ${pairId} on chain ${chainId}`);
      
      const response = await axios.get<DexScreenerResponse>(
        `${this.pairUrl}/${chainId}/${pairId}`,
        {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        return `No data found for pair ${pairId} on chain ${chainId}`;
      }

      const pair = response.data.pairs[0];
      const healthCheck = this.analyzeMarketHealth(pair);

      return `
PAIR ANALYSIS 📊
==============

Pair: ${pair.baseToken.symbol}/${pair.quoteToken.symbol}
DEX: ${pair.dexId}
Chain: ${chainId}

MARKET METRICS
-------------
💰 Price: ${parseFloat(pair.priceUsd || "0").toFixed(6)}
📊 24h Change: ${pair.priceChange?.h24?.toFixed(2)}%
💧 Liquidity: ${(pair.liquidity?.usd || 0).toLocaleString()}
📈 24h Volume: ${(pair.volume?.h24 || 0).toLocaleString()}
🔄 24h Transactions: ${pair.txns?.h24?.buys || 0} buys / ${pair.txns?.h24?.sells || 0} sells

HEALTH CHECK (${healthCheck.score}/100)
-----------
Status: ${healthCheck.status} ${healthCheck.status === 'LEGIT' ? '✅' : healthCheck.status === 'SUS' ? '⚠️' : '❌'}

Analysis:
${healthCheck.reasons.join('\n')}

Chart: ${pair.url}`;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          return "Rate limit exceeded. Please try again in a few minutes.";
        }
        if (error.response?.status === 404) {
          return `Pair not found. Please verify the pair address and chain ID.`;
        }
        if (error.code === 'ECONNABORTED') {
          return "Request timed out. Please try again.";
        }
        return `API Error: ${error.message}`;
      }
      return "An unexpected error occurred while fetching pair data.";
    }
  }

  supportsNetwork = (network: Network) => true;
}

export const dexScreenerActionProvider = () => new DexScreenerActionProvider();