import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AVAILABLE_SERVICES, findServiceByName } from '../../../data/services';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory = [], streaming = true } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Create enhanced system prompt for payment intent recognition
    const availableServicesText = AVAILABLE_SERVICES.map(s =>
      `${s.name}: $${s.price}/${s.period} (${s.provider})`
    ).join('\n');

    const systemPrompt = `You are a helpful AI payment assistant that can recognize payment requests and process them securely.

AVAILABLE SERVICES:
${availableServicesText}

PAYMENT INTENT DETECTION:
When users request payment for services (using phrases like "결제해줘", "사줘", "구독해줘", "pay for", "buy", "subscribe"), you must:

1. Identify the service from the available list
2. Extract payment details
3. Respond with a JSON object wrapped in <PAYMENT_INTENT> tags like this:

<PAYMENT_INTENT>
{
  "hasPaymentIntent": true,
  "service": "netflix-basic",
  "serviceName": "Netflix Basic",
  "amount": 15.99,
  "currency": "USD",
  "type": "subscription",
  "period": "monthly",
  "confirmationMessage": "Netflix Basic 구독 ($15.99/월)을 결제하시겠습니까?",
  "image": "https://images.ctfassets.net/y2ske730sjqp/5QQ9SVIdc1tmkqrtFnG9U1/de758bba0f65dcc1c6bc1f31f161003d/BrandAssets_Logos_02-NSymbol.jpg?w=940",
  "url": "https://www.netflix.com",
  "provider": "Netflix"
}
</PAYMENT_INTENT>

If no payment intent is detected, respond normally and include:
<PAYMENT_INTENT>{"hasPaymentIntent": false}</PAYMENT_INTENT>

For Coupang products (like water, 삼다수), use this format:
<PAYMENT_INTENT>
{
  "hasPaymentIntent": true,
  "service": "coupang-samdasoo",
  "serviceName": "제주삼다수 그린 무라벨",
  "amount": 12.96,
  "currency": "USD",
  "type": "one-time",
  "confirmationMessage": "쿠팡에서 제주삼다수 그린 무라벨을 주문하시겠습니까?",
  "image": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/71398552289343-b41a602e-f62c-4f23-99f5-0a31785c8c32.jpg",
  "url": "https://www.coupang.com",
  "provider": "Coupang",
  "reviews": "513,835 개 상품평"
}
</PAYMENT_INTENT>

For unknown services, suggest available alternatives.
Always be helpful and conversational while including the payment intent data.
IMPORTANT: Always include image, url, provider, and reviews (if available) for all services.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    if (streaming) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as Array<{ role: string; content: string }>,
        stream: true,
        temperature: 0.7,
        max_tokens: 500,
      });

      const encoder = new TextEncoder();
      let promptTokens = 0;
      let completionTokens = 0;

      // Rough token estimation for prompt
      promptTokens = JSON.stringify(messages).length / 4;

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullResponse = '';

            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content || '';

              if (delta) {
                fullResponse += delta;
                completionTokens = Math.ceil(fullResponse.length / 4);

                // Filter out PAYMENT_INTENT tags from streaming content - comprehensive approach
                let filteredDelta = delta;

                // Block any content related to PAYMENT_INTENT
                const paymentIntentKeywords = [
                  '<PAYMENT_INTENT>',
                  '</PAYMENT_INTENT>',
                  'PAYMENT_INTENT',
                  'hasPaymentIntent',
                  '"hasPaymentIntent"',
                  'paymentIntent',
                  '"service":',
                  '"serviceName":',
                  '"confirmationMessage":'
                ];

                const shouldBlock = paymentIntentKeywords.some(keyword =>
                  delta.includes(keyword) || filteredDelta.includes(keyword)
                ) || (fullResponse.includes('<PAYMENT_INTENT>') && !fullResponse.includes('</PAYMENT_INTENT>'));

                if (shouldBlock) {
                  filteredDelta = '';
                }

                // Only send non-empty, clean deltas
                if (filteredDelta && filteredDelta.trim()) {
                  const data = JSON.stringify({
                    content: filteredDelta,
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                    finished: false,
                  });

                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              }

              if (chunk.choices[0]?.finish_reason === 'stop') {
                // Extract payment intent from full response
                let paymentIntent = null;
                let cleanResponse = fullResponse;
                const paymentIntentMatch = fullResponse.match(/<PAYMENT_INTENT>(.*?)<\/PAYMENT_INTENT>/s);

                if (paymentIntentMatch) {
                  try {
                    paymentIntent = JSON.parse(paymentIntentMatch[1].trim());
                    // Remove PAYMENT_INTENT tags from user-visible response
                    cleanResponse = fullResponse.replace(/<PAYMENT_INTENT>.*?<\/PAYMENT_INTENT>/s, '').trim();
                  } catch (e) {
                    console.error('Failed to parse payment intent:', e);
                  }
                }

                const finalData = JSON.stringify({
                  content: '',
                  promptTokens,
                  completionTokens,
                  totalTokens: promptTokens + completionTokens,
                  finished: true,
                  fullResponse: cleanResponse, // Send cleaned response to user
                  paymentIntent, // Include payment intent in response
                });
                controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                controller.close();
                break;
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = JSON.stringify({
              error: 'Failed to stream response',
              finished: true,
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as Array<{ role: string; content: string }>,
        temperature: 0.7,
        max_tokens: 500,
      });

      return NextResponse.json({
        message: completion.choices[0].message.content,
        usage: completion.usage,
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}