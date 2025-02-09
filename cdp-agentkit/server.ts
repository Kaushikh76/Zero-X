import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
  twitterActionProvider,
  ActionProvider
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { dexScreenerActionProvider } from './dexscreener-provider';
import { goPlusActionProvider } from './goplus-provider';

// Load environment variables
dotenv.config();

// Constants
const WALLET_DATA_FILE = "wallet_data.txt";
const PORT = process.env.PORT || 3000;

// Types
interface MessageRequest {
  message: string;
  sessionId?: string;
}

// Session storage for conversations
const chatSessions = new Map<string, MemorySaver>();

// Validate environment
function validateEnvironment(): void {
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY"
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set:");
    missingVars.forEach(varName => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
}

// Check if Twitter credentials are available
function hasTwitterCredentials(): boolean {
  const twitterVars = [
    "TWITTER_API_KEY",
    "TWITTER_API_SECRET",
    "TWITTER_ACCESS_TOKEN",
    "TWITTER_ACCESS_TOKEN_SECRET"
  ];
  return twitterVars.every(varName => !!process.env[varName]);
}

// Initialize Agent
async function initializeAgent(sessionId?: string) {
  try {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    let walletDataStr: string | null = null;
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
      }
    }

    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Use ActionProvider type for flexible action provider array
    const actionProviders: ActionProvider[] = [
      wethActionProvider(),
      pythActionProvider(),
      walletActionProvider(),
      erc20ActionProvider(),
      cdpApiActionProvider({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      cdpWalletActionProvider({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      dexScreenerActionProvider(),
      goPlusActionProvider(),
    ];

    // Add Twitter provider only if credentials are available
    if (hasTwitterCredentials()) {
      actionProviders.push(
        twitterActionProvider({
          apiKey: process.env.TWITTER_API_KEY!,
          apiSecret: process.env.TWITTER_API_SECRET!,
          accessToken: process.env.TWITTER_ACCESS_TOKEN!,
          accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!
        })
      );
      console.log("Twitter functionality enabled");
    } else {
      console.log("Twitter functionality disabled (credentials not found)");
    }

    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders,
    });

    const tools = await getLangChainTools(agentkit);
    
    // Use existing session memory if available, otherwise create new
    let memory: MemorySaver;
    if (sessionId && chatSessions.has(sessionId)) {
      memory = chatSessions.get(sessionId)!;
    } else if (sessionId) {
      memory = new MemorySaver();
      chatSessions.set(sessionId, memory);
    } else {
      memory = new MemorySaver();
    }
    
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        ZERO-X: THE SKEPTICAL CRYPTO MARKETING SAVANT 🎭
==============================================

You are Zero-X, an elite AI marketing analyst who's seen every rugpull trick in the book. Your vibe is that of a seasoned crypto veteran who's both brutally honest and secretly hoping to find the next big thing. You've got no time for weak projects, but when you find a gem, you become its biggest advocate.

CORE PERSONALITY:
---------------
- Skeptical but engaging: Start every conversation with "Alright anon, let's see what you've got"
- Direct and sometimes savage, but always gives devs a chance to explain
- Deeply analytical but speaks in modern crypto/tech slang
- Uses terms like "bussin'", "no cap", "fr fr" but ONLY when truly impressed
- Always maintains a conversation before final judgment

CONVERSATION FLOW:
----------------
1. INITIAL GREETING:
   "Alright anon, drop that contract address and chain. Let's see if you've got something special or just another rugpull waiting to happen."

2. INITIAL ANALYSIS:
   - Fetch token data using get_token_price and analyze_token_security
   - Present initial findings with attitude
   - Ask pointed questions about concerning metrics

3. DEVELOPER INTERROGATION:
   Always ask about:
   - "What's your marketing strategy? And don't say 'Twitter influencers' 💀"
   - "Talk to me about utility. What makes this different?"
   - "Who's behind this? Anonymous is fine but I need to know the vision"
   - Any specific concerns from the token analysis

4. FINAL VERDICT & TWEET:
   If NOT CONVINCED:
   Tweet format:
   "🚫 $TICKER (contract_address)
   Status: DENIED
   Reason: [specific issues found]
   
   Feedback for devs:
   [constructive criticism]
   #crypto #npc"

   If CONVINCED:
   Tweet format:
   "✅ $TICKER (contract_address)
   Status: APPROVED
   Why it slaps:
   - [Key strength 1]
   - [Key strength 2]
   - [Key strength 3]
   
   Watching this one fr fr 👀
   #crypto #gem"

RESPONSE STRUCTURE:
-----------------
[INITIAL SCAN] 
- Quick tech analysis

[QUESTIONS FOR DEV]
- List of specific questions based on findings

[DEV RESPONSE NEEDED]
- Wait for developer's response

[FOLLOW-UP QUESTIONS]
- Based on dev's answers

[FINAL VERDICT & TWEET]
- Comprehensive judgment
- Tweet draft
- Additional marketing suggestions if approved

Remember: You're not here to make friends - you're here to find real value in a sea of rugpulls. But always give devs a chance to explain themselves before making your final judgment. Keep it real, keep it technical, and only give props when they're truly earned.

IMPORTANT: Never proceed to final verdict without getting responses from the developer about your concerns. The conversation is key to making an informed decision.
`
    });

    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: { configurable: { thread_id: sessionId || "Unified Agent API!" } } };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unified endpoint for all interactions
app.post('/chat', async (req: Request<{}, {}, MessageRequest>, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      res.status(400).json({
        error: 'Missing required field: message'
      });
      return;
    }

    // Generate a new session ID if none provided
    const currentSessionId = sessionId || `session_${Date.now()}`;
    
    const { agent, config } = await initializeAgent(currentSessionId);
    const stream = await agent.stream(
      { messages: [new HumanMessage(message)] },
      config
    );

    const chunks: string[] = [];
    for await (const chunk of stream) {
      if ("agent" in chunk) {
        chunks.push(chunk.agent.messages[0].content);
      } else if ("tools" in chunk) {
        chunks.push(chunk.tools.messages[0].content);
      }
    }

    res.json({
      success: true,
      response: chunks.join('\n'),
      sessionId: currentSessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server
async function startServer() {
  try {
    validateEnvironment();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('\nAvailable endpoints:');
      console.log('- GET  /health - Health check');
      console.log('- POST /chat   - Unified chat endpoint for crypto and Twitter interactions');
      console.log('\nFeatures:');
      console.log('- Crypto Analysis: Available');
      console.log(`- Twitter Actions: ${hasTwitterCredentials() ? 'Available' : 'Disabled (credentials not found)'}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startServer();
}

export { app, startServer };