import OpenAI from "openai"
import 'dotenv/config'
import { zodResponseFormat } from 'openai/helpers/zod'
import zodToJsonSchema from "zod-to-json-schema"
import z from "zod"
import { debug } from '../utils/debug.mjs'
export const openai = new OpenAI(process.env.OPENAI_API_KEY)

export const ask = async (prompt, config) => {
  config = {
    model: 'gpt-4o-mini',
    system: 'You are a helpful assistant',
    messages: [],
    ...(config || {}),
  }
  let { model, system, messages } = config

  let response = await openai.chat.completions.create({
    model: model,
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
  return response.choices[0].message.content
}

export class AiFn {
  constructor(fn, definition) {
    this.fn = fn
    this.definition = {
      type: 'function',
      function: {
        name: fn.name,
        // strict: true,
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

export const createStructuredAsk = (
  name,
  query,
  zodSchema,
  config = {}
) => {
  config = {
    model: process.env.DEFAULT_OPENAI_MODEL,
    system: query,
    messages: [],
    ...(config || {}),
    schemaName: 'answer_the_question',
  }
  let { model, system, messages } = config
  let structuredAsk = async function (prompt) {
    let options = {
      model: model,
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
    // debug({ structuredAskOptions: options }, 7)
    let response = await openai.beta.chat.completions.parse(options)
    return response.choices[0].message.parsed
  }
  structuredAsk.getTool = () => {
    return new AiFn(structuredAsk, zodToJsonSchema(zodSchema))
  }
  return structuredAsk
}

export const structuredAsk = async (
  systemMessage,
  zodSchema,
  prompt,
  config
) => {
  const createStructuredAsk = (
    name,
    query,
    zodSchema,
    config = {}
  ) => {
    config = {
      model: process.env.DEFAULT_OPENAI_MODEL,
      system: query,
      messages: [],
      ...(config || {}),
      schemaName: 'answer_the_question',
    }
    let { model, system, messages } = config
    let structuredAsk = async function (prompt) {
      let options = {
        model: model,
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
      // debug({ structuredAskOptions: options }, 7)
      let response = await openai.beta.chat.completions.parse(options)
      return response.choices[0].message.parsed
    }
    structuredAsk.getTool = () => {
      return new AiFn(structuredAsk, zodToJsonSchema(zodSchema))
    }
    return structuredAsk
  }
  let ask = createStructuredAsk(systemMessage, zodSchema, config)
  return await ask(prompt)
}

export const toolAsk = async (prompt, tools, config) => {
  tools = Array.isArray(tools) ? tools : [tools]
  config = {
    model: 'gpt-4o-mini',
    system: 'You are a helpful assistant',
    messages: [],
    ...(config || {}),
  }
  let { model, system, messages } = config
  messages = [{ role: 'system', content: system }, ...messages, { role: 'user', content: prompt }]

  let completionConfig = {
    model,
    messages,
    tools,
  }
  // debug({ completionConfig }, 7)
  let runner = openai.beta.chat.completions.runTools(completionConfig)

  runner.on('functionCall', (event) => {
    debug(event)
  })

  // let response = await runner.finalChatCompletion()
  let response = await runner.allChatCompletions()

  debug({ response }, 7)
  return response.choices[0].message.content

}

/**
      {
        type: 'function',
        function: {
          function: getWeather as (args: { location: string; time: Date }) => any,
          parse: parseFunction as (args: strings) => { location: string; time: Date },
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              time: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
 */