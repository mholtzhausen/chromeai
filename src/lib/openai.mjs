import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import zodToJsonSchema from 'zod-to-json-schema'

let openaiInstance = null

export class OpenAIError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'OpenAIError'
    this.code = code
  }
}

export const initOpenAI = async () => {
  if (openaiInstance) return openaiInstance

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      const apiKey = result.openaiApiKey || process.env.OPENAI_API_KEY

      if (!apiKey) {
        reject(new OpenAIError('OpenAI API key not found. Please add it in settings.', 'NO_API_KEY'))
        return
      }

      try {
        openaiInstance = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
        resolve(openaiInstance)
      } catch (error) {
        reject(new OpenAIError('Failed to initialize OpenAI client.', 'INIT_FAILED'))
      }
    })
  })
}

export const getOpenAI = async () => {
  return await initOpenAI()
}

export const ask = async (prompt, config) => {
  try {
    const openai = await getOpenAI()
    config = {
      model: 'gpt-4',
      system: 'You are a helpful assistant',
      messages: [],
      ...(config || {}),
    }

    const { model, system, messages } = config

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: system,
        },
        ...messages,
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    if (!response.choices?.[0]?.message?.content) {
      throw new OpenAIError('Invalid response from OpenAI', 'INVALID_RESPONSE')
    }

    return response.choices[0].message.content
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error
    }

    // Handle rate limits
    if (error.status === 429) {
      throw new OpenAIError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT')
    }

    // Handle invalid API key
    if (error.status === 401) {
      throw new OpenAIError('Invalid API key. Please check your settings.', 'INVALID_API_KEY')
    }

    throw new OpenAIError('Failed to get response from OpenAI', 'API_ERROR')
  }
}

export class AiFn {
  constructor(fn, definition) {
    this.fn = fn
    this.definition = {
      type: 'function',
      function: {
        name: fn.name,
        function: fn,
        description: 'AI function',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query to search for on the internet.',
            },
          },
          required: ['query'],
        },
      },
    }
  }
}

export const createStructuredAsk = (name, query, zodSchema, config = {}) => {
  config = {
    model: process.env.DEFAULT_OPENAI_MODEL || 'gpt-4',
    system: query,
    messages: [],
    ...(config || {}),
    schemaName: 'answer_the_question',
  }

  const { model, system, messages } = config

  const structuredAsk = async function (prompt) {
    try {
      const openai = await getOpenAI()
      const options = {
        model,
        messages: [
          {
            role: 'system',
            content: system,
          },
          ...messages,
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: zodResponseFormat(zodSchema, config.schemaName),
      }

      const response = await openai.beta.chat.completions.parse(options)

      if (!response.choices?.[0]?.message?.parsed) {
        throw new OpenAIError('Invalid structured response from OpenAI', 'INVALID_STRUCTURED_RESPONSE')
      }

      return response.choices[0].message.parsed
    } catch (error) {
      if (error instanceof OpenAIError) {
        throw error
      }
      throw new OpenAIError('Failed to get structured response from OpenAI', 'STRUCTURED_API_ERROR')
    }
  }

  structuredAsk.getTool = () => {
    return new AiFn(structuredAsk, zodToJsonSchema(zodSchema))
  }

  return structuredAsk
}

export const toolAsk = async (prompt, tools, config) => {
  try {
    const openai = await getOpenAI()
    tools = Array.isArray(tools) ? tools : [tools]

    config = {
      model: 'gpt-4',
      system: 'You are a helpful assistant',
      messages: [],
      ...(config || {}),
    }

    const { model, system, messages } = config
    const formattedMessages = [
      { role: 'system', content: system },
      ...messages,
      { role: 'user', content: prompt }
    ]

    const completionConfig = {
      model,
      messages: formattedMessages,
      tools,
    }

    const runner = openai.beta.chat.completions.runTools(completionConfig)

    runner.on('functionCall', (event) => {
      console.debug('Function call:', event)
    })

    const response = await runner.allChatCompletions()

    if (!response.choices?.[0]?.message?.content) {
      throw new OpenAIError('Invalid tool response from OpenAI', 'INVALID_TOOL_RESPONSE')
    }

    return response.choices[0].message.content
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error
    }
    throw new OpenAIError('Failed to execute tool with OpenAI', 'TOOL_API_ERROR')
  }
}
