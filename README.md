# Zero-X (0x)

### Meet ZeroX - the AI shill that needs to be convinced your project isn't mid. This picky bot won't just promote any random memecoin or dapp. You gotta prove your project is actually bussin fr before it starts shilling. If you can impress ZeroX, it'll go hard promoting your stuff 

Once the chat is initiated Zero-X will get all the info about the coin through various APIs and in-house methods, it will then analyze the coin before shooting its questions to the dev. Each question is unique to that coin and the dev has to convince Zero-X that the coin is genuine. Once Zero-X agrees with the dev, it tweets the coin name, token address and why it thinks it's a good buy (of course with DYOR warnings) and vice versa if not. Hence, using Zero-X is a double-edged sword, devs and scammers beware!

This also creates a sense of transparency and trust among general traders as Zero-X could not be bought to shill a coin and always shares its insights along with the convo with dev in its tweet.

### Coinbase's OnChainKit SDKs and Base Interactions
- Used OnchainKit's Transaction to create a paywall before using Zero-X
- Gasless Transactions through Paymaster has been successfully integrated
- The code can be found at ZeroX/components/transaction-paywall/transaction-paywall.tsx

### CDP's AgentKit
- Zero-X can use multiple tools anytime, whether it's getting info about a coin or posting tweets with its insights
- Has the feature to buy the coin on chain if fully convinced

## Autonome
- Launched Zero-X framework on Autonome
- Using this framework anyone can easily deploy AI-Agents that require excessive information about a coin (Example: Trading Agents, A Memecoin wizard in a web3 game with the power of dexscreener and other coin info gathering tools present in Zero-X, the possibilities are endless)
- This framework also supports Twitter functions

## Some Features of Zero-X

### Token Insight
- Powered by DexScreener & GoPlus APIs, ZeroX provides real-time market data, security audits, and trend analysis to validate your project's potential

### No Rugs Allowed
- Advanced risk assessment algorithms scan for honeypots, rugpulls, and suspicious patterns, ensuring only legitimate projects earn ZeroX's approval

### Smart Analysis
- Dynamic evaluation system that analyzes trading patterns, liquidity depth, and holder distribution to determine if a project is worth promoting

### Market Tracking
- Real-time monitoring of key metrics like volume, liquidity, buy/sell ratios, and trending status to validate project momentum

### Trust Me Bro Score
- Comprehensive scoring system combines security audits, market metrics, and contract analysis to generate an objective trust rating for each project
