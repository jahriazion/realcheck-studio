# RealCheck Suite - AI Setup Guide

## Quick Start

1. **Get your OpenAI API Key:**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Add the API Key to your environment:**
   - Open `.env.local` file in your project root
   - Replace `your-openai-api-key-here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Restart your development server:**
   ```bash
   bun run dev
   ```

## AI Models Available

- **RC Mini** (`rc-mini`): Uses GPT-4o-mini - Fast and cost-effective
- **RC Pro** (`rc-pro`): Uses GPT-4o - More powerful and accurate (requires Pro subscription)

## Features

- ✅ Real-time streaming responses
- ✅ Chat history persistence
- ✅ Multiple AI models
- ✅ Error handling and recovery
- ✅ User authentication integration
- ✅ Pro tier restrictions

## Troubleshooting

If AI is not working:
1. Check that `OPENAI_API_KEY` is set in `.env.local`
2. Verify your API key is valid and has credits
3. Check the browser console for errors
4. Restart the development server after adding the API key

## Cost Management

- RC Mini (GPT-4o-mini) is very cost-effective
- RC Pro (GPT-4o) is more expensive but more capable
- Monitor your usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)
